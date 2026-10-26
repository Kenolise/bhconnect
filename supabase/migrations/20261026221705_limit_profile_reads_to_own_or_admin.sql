/*
  # Limit member directory reads to own row and administrators

  The profile table previously allowed every signed-in member to read every
  other member's row, exposing the full name, email address and administrator
  flag of everyone in the library.

  1. Security
     - Replace the unconditional SELECT policy with one that returns the
       caller's own row, plus all rows when the caller is an administrator.

  2. Notes
     1. The app only ever reads the signed-in member's own profile, so no
        feature depends on the wider read.
     2. Administrators keep full visibility for member management.
*/

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;

CREATE POLICY "profiles_select_own_or_admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_current_admin());
