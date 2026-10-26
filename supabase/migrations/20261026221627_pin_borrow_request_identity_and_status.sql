/*
  # Pin borrow request identity and status server-side

  Members could previously supply every column when creating a borrow
  request, because INSERT was granted at table level. That allowed a member
  to create a request already marked as approved (bypassing the admin review
  step entirely) and to submit a request under another member's name and
  email address.

  1. Changes
     - New `BEFORE INSERT` trigger `borrow_requests_set_identity` that always
       forces `status` to 'pending' and fills `requester_email`,
       `requester_name` and `user_id` from the signed-in caller's own profile,
       ignoring whatever the browser sent.

  2. Security
     - Revoke table-wide INSERT on `borrow_requests` from `authenticated`.
     - Re-grant INSERT on `book_id` only; every other column is now filled by
       the trigger or by its column default.
     - The approval state machine in `approve_borrow_request` is therefore the
       only path that can move a request out of 'pending'.

  3. Notes
     1. Existing rows are untouched.
     2. The browser no longer needs to send identity fields at all.
*/

CREATE OR REPLACE FUNCTION public.borrow_requests_set_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text;
  v_name  text;
BEGIN
  SELECT email, full_name INTO v_email, v_name
  FROM profiles
  WHERE id = auth.uid();

  NEW.user_id         := auth.uid();
  NEW.requester_email := COALESCE(v_email, '');
  NEW.requester_name  := COALESCE(NULLIF(v_name, ''), COALESCE(v_email, ''));
  NEW.status          := 'pending';

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.borrow_requests_set_identity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS borrow_requests_set_identity ON borrow_requests;
CREATE TRIGGER borrow_requests_set_identity
  BEFORE INSERT ON borrow_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.borrow_requests_set_identity();

REVOKE INSERT ON borrow_requests FROM authenticated;
GRANT INSERT (book_id) ON borrow_requests TO authenticated;
