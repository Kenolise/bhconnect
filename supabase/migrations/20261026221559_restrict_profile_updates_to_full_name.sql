/*
  # Restrict member profile updates to the name column

  Members could previously update every column of their own profile row,
  including the administrator flag, because the UPDATE privilege was granted
  at table level. That allowed any signed-in member to promote themselves to
  administrator with a single direct API call.

  1. Security
     - Revoke table-wide UPDATE on `profiles` from `authenticated`.
     - Re-grant UPDATE on the `full_name` column only, which is the sole
       field a member legitimately edits about themselves.
     - The existing row-level policy (own row only) is unchanged and still
       applies on top of the narrowed column grant.

  2. Notes
     1. The administrator flag can now only be changed by a privileged
        database role, never by the browser.
     2. No data is modified; existing administrators keep their access.
*/

REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (full_name) ON profiles TO authenticated;
