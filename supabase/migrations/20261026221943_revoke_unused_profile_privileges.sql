/*
  # Remove unused insert and delete privileges on the profile table

  Members held insert and delete privileges on the profile table even though
  no policy permitted either action and the app never performs them. Profile
  rows are created by the signup trigger, which runs with elevated rights.

  1. Security
     - Revoke INSERT and DELETE on `profiles` from `authenticated`.
     - Read access and the name-only update remain unchanged.

  2. Notes
     1. Account creation continues to work: the signup trigger is unaffected.
*/

REVOKE INSERT, DELETE ON profiles FROM authenticated;
