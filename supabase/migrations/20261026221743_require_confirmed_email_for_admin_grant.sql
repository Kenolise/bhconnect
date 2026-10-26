/*
  # Require a confirmed email before granting administrator rights

  New accounts were given administrator rights purely because the signup form
  carried one of two allowlisted email addresses. Nothing proved the person
  signing up actually owned that mailbox, so whoever registered one of those
  addresses first would have taken control of the library.

  1. Changes
     - `handle_new_user()` now grants the administrator flag only when the
       address is on the operator allowlist AND the account's email has been
       confirmed.

  2. Security
     - Signup alone is no longer sufficient to obtain administrator rights.
     - Once email confirmation is enabled in the Auth settings, this check
       requires a real mailbox round-trip before any privilege is granted.

  3. Notes
     1. The two allowlisted addresses keep their intended path to becoming
        administrators; nothing else changes for ordinary members.
     2. No existing rows are modified.
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
    NEW.email IN ('kenosedeme@gmail.com', 'arielle.db7@gmail.com')
      AND NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
