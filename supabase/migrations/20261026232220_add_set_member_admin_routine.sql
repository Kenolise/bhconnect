/*
  # Secure admin promotion/demotion routine

  Replaces the old email-allowlist approach to granting administrator rights.
  No one becomes an administrator automatically at signup anymore. Instead,
  an existing administrator promotes another member through the app, backed by
  a secure server routine that verifies the caller's admin status before
  making any change.

  1. Changes
     - New `SECURITY DEFINER` function `set_member_admin(target uuid, value boolean)`
       that promotes or demotes a member. It:
         1. Verifies the caller is an administrator via `is_current_admin()`.
         2. Refuses to let an admin demote themselves (prevents accidental
            removal of the last administrator).
         3. Updates the target member's `is_admin` flag.

  2. Security
     - Revoke EXECUTE from PUBLIC, anon so the function is not callable by
       unauthenticated users.
     - Grant EXECUTE to `authenticated` only — the function itself enforces
       that the caller is an administrator.

  3. Notes
     1. The function is the only path through which admin rights change hands.
     2. Existing administrators keep their access; no rows are modified.
*/

CREATE OR REPLACE FUNCTION public.set_member_admin(target uuid, value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT is_current_admin() THEN
    RAISE EXCEPTION 'Only administrators can change member roles.';
  END IF;

  IF target = auth.uid() AND value = false THEN
    RAISE EXCEPTION 'You cannot demote yourself. Ask another administrator.';
  END IF;

  UPDATE profiles
     SET is_admin = value
   WHERE id = target;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found.';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_member_admin(target uuid, value boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_member_admin(target uuid, value boolean) TO authenticated;
