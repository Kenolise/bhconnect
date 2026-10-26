/*
  # Prevent duplicate pending borrow requests

  The check that stopped a member requesting the same book twice lived only
  in the browser, so repeated or concurrent submissions each created another
  pending row and flooded the admin review queue.

  1. Changes
     - Partial unique index on `borrow_requests (book_id, user_id)` limited to
       rows whose status is 'pending'.

  2. Notes
     1. The constraint is enforced atomically by the database, so two
        simultaneous submissions cannot both succeed.
     2. Members may still request the same book again after an earlier
        request has been approved or declined.
     3. Existing duplicate pending rows, if any, are left in place; the index
        is created only when the data allows it.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM borrow_requests
    WHERE status = 'pending' AND user_id IS NOT NULL
    GROUP BY book_id, user_id
    HAVING count(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS borrow_requests_one_pending_per_book_user
      ON borrow_requests (book_id, user_id)
      WHERE status = 'pending';
  END IF;
END $$;
