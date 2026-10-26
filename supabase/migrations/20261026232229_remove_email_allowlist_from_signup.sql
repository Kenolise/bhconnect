/*
  # Remove email allowlist from signup

  Administrator rights are now granted person-to-person through the
  `set_member_admin` routine instead of being auto-granted at signup based on
  a hardcoded list of email addresses. This removes the allowlist from the
  new-user trigger so new signups always start as regular members.

  1. Changes
     - `handle_new_user()` no longer sets `is_admin` based on email. All new
       accounts start with `is_admin = false`.

  2. Security
     - Signup alone can never produce an administrator account again.
     - EXECUTE remains revoked from PUBLIC, anon, authenticated (trigger only).

  3. Notes
     1. Existing administrator rows are untouched.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
