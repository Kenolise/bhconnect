/*
  # Revoke unauthenticated privileges on the profile table

  The profile table still carried read and write privileges for the
  unauthenticated role. Row level security denied those requests because no
  policy targets that role, but the privileges themselves were wrong and
  would have become a live data leak the moment any permissive policy was
  added.

  1. Security
     - Revoke all privileges on `profiles` from the unauthenticated role.

  2. Notes
     1. The app always reads profiles as a signed-in member, so nothing
        depends on these privileges.
*/

REVOKE ALL ON profiles FROM anon;
