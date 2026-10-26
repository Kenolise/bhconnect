/*
# Add real member authentication, profiles, and secure RLS

## Summary
Converts the app from localStorage-based mock auth to real Supabase email/password
authentication. Adds a `profiles` table linked to `auth.users`, automatically created
on signup. Adds admin detection for two hardcoded admin emails. Tightens RLS so the
library and borrow requests require a signed-in account, with write access to the
library restricted to admins. Borrow requests are now tied to the authenticated
user's account.

## New Tables

### profiles
- `id` (uuid, primary key, references auth.users) — matches the auth user
- `email` (text, not null) — copied from auth.users for convenient display
- `full_name` (text, not null, default '') — the member's display name
- `is_admin` (boolean, not null, default false) — whether this user can manage the library and requests
- `created_at` (timestamptz) — when the profile was created

## Modified Tables

### borrow_requests
- Added `user_id` (uuid, references auth.users, ON DELETE CASCADE, defaults to auth.uid())
  so every request is tied to a real account. Existing rows (if any) keep NULL user_id
  and are only visible to admins.

### library_resources
- No schema changes. RLS policies are replaced (see below).

## New Functions

### handle_new_user()
Trigger function (SECURITY DEFINER) that runs after a new auth.users row is inserted.
Creates a matching profiles row with the email and full_name from user metadata.
Sets `is_admin = true` if the email matches one of the configured admin addresses.

### is_current_admin()
A STABLE SECURITY DEFINER function that returns true if the current authenticated
user has `is_admin = true` in profiles. Used by RLS policies to restrict library
writes and request management to admins.

## Modified Functions

### approve_borrow_request(request_id uuid)
Now checks that the caller is an admin before approving. EXECUTE revoked from anon
and PUBLIC, granted to authenticated only.

## Security

### profiles
- RLS enabled.
- GRANT SELECT TO authenticated (all members can see each other's profiles).
- GRANT UPDATE (full_name) TO authenticated — members can update only their own name.
  `is_admin` and `email` are NOT updatable by members.
- INSERT is not granted to authenticated; profiles are created only by the trigger.
- SELECT policy: all authenticated users can read all profiles (church community).
- UPDATE policy: members can update only their own row.

### library_resources
- RLS enabled (was already).
- All anon grants and policies are dropped. The app now requires sign-in.
- GRANT SELECT, INSERT, UPDATE, DELETE TO authenticated.
- SELECT policy: any authenticated user can browse the shared library.
- INSERT/UPDATE/DELETE policies: restricted to admins via `is_current_admin()`.

### borrow_requests
- RLS enabled (was already).
- All anon grants and policies are dropped.
- GRANT SELECT, INSERT, UPDATE, DELETE TO authenticated.
- SELECT policy: a member can see their own requests; admins see all.
- INSERT policy: a member can create requests only for themselves (auth.uid() = user_id).
- UPDATE/DELETE policies: restricted to admins.

### Functions
- `is_current_admin()`: EXECUTE revoked from PUBLIC and anon; granted to authenticated.
- `approve_borrow_request()`: EXECUTE revoked from PUBLIC and anon; granted to authenticated.
  Added admin check inside the function body.

## Important Notes
1. Admin emails are `kenosedeme@gmail.com` and `arielle.db7@gmail.com`. These are
   hardcoded in the `handle_new_user` trigger function. When someone registers with
   one of these emails, their profile is automatically created with `is_admin = true`.
2. Email confirmation is NOT required — members can sign in immediately after registering.
3. The library remains shared: all members see the same books and availability.
4. Existing borrow_requests rows (if any) have NULL user_id and are visible only to admins.
*/

-- ============================================================
-- PROFILES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies if re-running
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- All authenticated members can see all profiles (church community directory)
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

-- Members can update only their own profile, and only the name
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Grants: SELECT for all, UPDATE only on full_name column
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE (full_name) ON profiles TO authenticated;

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email IN ('kenosedeme@gmail.com', 'arielle.db7@gmail.com')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ADMIN CHECK HELPER
-- ============================================================

CREATE OR REPLACE FUNCTION is_current_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM profiles WHERE id = auth.uid()), false);
$$;

REVOKE EXECUTE ON FUNCTION is_current_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_current_admin() TO authenticated;

-- ============================================================
-- LIBRARY_RESOURCES — tighten to authenticated, admin-only writes
-- ============================================================

-- Revoke anon access
REVOKE SELECT, INSERT, UPDATE, DELETE ON library_resources FROM anon;

-- Drop old anon policies
DROP POLICY IF EXISTS "anon_select_library" ON library_resources;
DROP POLICY IF EXISTS "anon_insert_library" ON library_resources;
DROP POLICY IF EXISTS "anon_update_library" ON library_resources;
DROP POLICY IF EXISTS "anon_delete_library" ON library_resources;

-- Authenticated can read; admins can write
DROP POLICY IF EXISTS "select_library_authenticated" ON library_resources;
CREATE POLICY "select_library_authenticated" ON library_resources FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_library_admin" ON library_resources;
CREATE POLICY "insert_library_admin" ON library_resources FOR INSERT
  TO authenticated WITH CHECK (is_current_admin());

DROP POLICY IF EXISTS "update_library_admin" ON library_resources;
CREATE POLICY "update_library_admin" ON library_resources FOR UPDATE
  TO authenticated USING (is_current_admin()) WITH CHECK (is_current_admin());

DROP POLICY IF EXISTS "delete_library_admin" ON library_resources;
CREATE POLICY "delete_library_admin" ON library_resources FOR DELETE
  TO authenticated USING (is_current_admin());

-- ============================================================
-- BORROW_REQUESTS — add user_id, tighten RLS
-- ============================================================

ALTER TABLE borrow_requests
  ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS borrow_requests_user_id_idx ON borrow_requests(user_id);

-- Revoke anon access
REVOKE SELECT, INSERT, UPDATE, DELETE ON borrow_requests FROM anon;

-- Drop old anon policies
DROP POLICY IF EXISTS "anon_select_borrow_requests" ON borrow_requests;
DROP POLICY IF EXISTS "anon_insert_borrow_requests" ON borrow_requests;
DROP POLICY IF EXISTS "anon_update_borrow_requests" ON borrow_requests;
DROP POLICY IF EXISTS "anon_delete_borrow_requests" ON borrow_requests;

-- SELECT: members see own requests, admins see all
DROP POLICY IF EXISTS "select_own_requests" ON borrow_requests;
CREATE POLICY "select_own_requests" ON borrow_requests FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_current_admin());

-- INSERT: members can only create requests for themselves
DROP POLICY IF EXISTS "insert_own_request" ON borrow_requests;
CREATE POLICY "insert_own_request" ON borrow_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- UPDATE: admins only (approve/reject)
DROP POLICY IF EXISTS "update_request_admin" ON borrow_requests;
CREATE POLICY "update_request_admin" ON borrow_requests FOR UPDATE
  TO authenticated USING (is_current_admin()) WITH CHECK (is_current_admin());

-- DELETE: admins only
DROP POLICY IF EXISTS "delete_request_admin" ON borrow_requests;
CREATE POLICY "delete_request_admin" ON borrow_requests FOR DELETE
  TO authenticated USING (is_current_admin());

-- ============================================================
-- APPROVE FUNCTION — add admin check, restrict execute
-- ============================================================

CREATE OR REPLACE FUNCTION approve_borrow_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_book_id uuid;
BEGIN
  IF NOT is_current_admin() THEN
    RAISE EXCEPTION 'Only admins can approve borrow requests';
  END IF;

  SELECT book_id INTO v_book_id
  FROM borrow_requests
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  UPDATE borrow_requests SET status = 'approved' WHERE id = request_id;

  UPDATE library_resources
  SET available_copies = GREATEST(available_copies - 1, 0),
      updated_at = now()
  WHERE id = v_book_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION approve_borrow_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION approve_borrow_request(uuid) TO authenticated;
