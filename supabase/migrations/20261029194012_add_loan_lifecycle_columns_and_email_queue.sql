/*
  # Add 21-day loan lifecycle, pickup window, and loan email queue

  Extends borrow requests so every request moves through a clear lifecycle
  and adds a queue of emails that the server sends on the library's behalf.

  1. Borrow request statuses
     - pending   : waiting in line (no copy assigned yet)
     - ready     : a copy is held for the member; they have 7 days to collect it
     - borrowed  : collected; the 21-day loan is running
     - returned  : the book has been handed back
     - rejected  : declined by an administrator
     - expired   : the member did not collect the book within 7 days

  2. New columns on borrow_requests
     - ready_at / pickup_deadline : when the copy was held and when the hold ends
     - collected_at / due_at      : when the book was collected and when it is due (21 days later)
     - returned_at               : when the book was returned
     - first_reminder_sent_at    : set when the "14 days left" email is queued (7 days after collection)
     - second_reminder_sent_at   : set when the "7 days left" email is queued (14 days after collection)

  3. Existing data
     - Requests previously marked 'approved' are on loan today, so they become
       'borrowed'. Their 21 days start from the day this migration runs.

  4. New table loan_emails
     - A queue of emails (pickup ready, 14 days left, 7 days left).
     - Only the server (service role) can read or write it. Members and
       anonymous visitors have no access.

  5. Security
     - RLS enabled on loan_emails with no policies for members, so only the
       server role can reach it.
     - Waitlist rule: a member can have only one active request (pending,
       ready or borrowed) per book. The old "one pending" rule is replaced.

  6. Notes
     1. Existing rows are never deleted.
     2. Copy counts are not changed by this migration.
*/

ALTER TABLE borrow_requests DROP CONSTRAINT IF EXISTS borrow_requests_status_check;

ALTER TABLE borrow_requests
  ADD COLUMN IF NOT EXISTS ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS pickup_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS collected_at timestamptz,
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS returned_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS second_reminder_sent_at timestamptz;

UPDATE borrow_requests
   SET status = 'borrowed',
       collected_at = now(),
       due_at = now() + interval '21 days'
 WHERE status = 'approved';

ALTER TABLE borrow_requests
  ADD CONSTRAINT borrow_requests_status_check
  CHECK (status IN ('pending', 'ready', 'borrowed', 'returned', 'rejected', 'expired'));

DROP INDEX IF EXISTS borrow_requests_one_pending_per_book_user;
CREATE UNIQUE INDEX IF NOT EXISTS borrow_requests_one_active_per_book_user
  ON borrow_requests (book_id, user_id)
  WHERE status IN ('pending', 'ready', 'borrowed');

CREATE INDEX IF NOT EXISTS borrow_requests_book_queue_idx
  ON borrow_requests (book_id, created_at, id)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS loan_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  borrow_request_id uuid NOT NULL REFERENCES borrow_requests(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('ready_for_pickup', 'reminder_14_days', 'reminder_7_days')),
  recipient_email text NOT NULL,
  recipient_name text NOT NULL DEFAULT '',
  book_title text NOT NULL,
  due_at timestamptz,
  pickup_deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  last_error text
);

CREATE INDEX IF NOT EXISTS loan_emails_unsent_idx ON loan_emails (created_at) WHERE sent_at IS NULL;

ALTER TABLE loan_emails ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON loan_emails TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;
