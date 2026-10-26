/*
  # One-time admin promotion for the first administrator

  There is currently no administrator in the system, so the new
  person-to-person promotion screen cannot be used yet. This migration
  promotes the existing verified account for kenosedeme@gmail.com to
  administrator as a one-time bootstrap. All future promotions happen
  through the app's Members management screen.

  1. Changes
     - Set is_admin = true for the profile whose email matches
       kenosedeme@gmail.com.

  2. Notes
     1. Only one row is affected; no other member's role changes.
     2. This is a one-time bootstrap and does not need to be re-run.
*/

UPDATE profiles
   SET is_admin = true
 WHERE lower(email) = 'kenosedeme@gmail.com';
