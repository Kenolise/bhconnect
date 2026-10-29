/*
  # Loan workflow: approval, pickup, collection, return, waitlist, and reminders

  Adds the server-side rules for the 21-day loan and the first-come waiting list.
  Every change to a borrow request's state happens inside these functions so the
  copy counts and the email queue always stay in step.

  1. Functions
     - approve_borrow_request(request_id)
         Admin only. Holds a free copy for the member (status 'ready') and gives
         them 7 days to collect it. Only the first person in line can be approved,
         and only when a copy is free.
     - mark_borrow_collected(request_id)
         Admin only. Records the collection and starts the 21-day loan.
     - mark_borrow_returned(request_id)
         Admin only. Marks the book returned, frees the copy, and automatically
         offers it to the next person in line.
     - assign_next_in_line(book_id)
         Internal. Gives free copies to the earliest waiting members and queues
         their "ready for pickup" email.
     - release_expired_holds()
         Internal. Ends holds not collected within 7 days, marks them 'expired',
         and passes the copy to the next person in line.
     - queue_loan_reminders()
         Internal. Queues the "14 days left" email 7 days after collection and the
         "7 days left" email 14 days after collection. Each is queued once only.
     - run_loan_schedule()
         Runs the expiry and reminder checks. Scheduled hourly.
     - my_active_requests()
         Lets a member see their own pending, ready and borrowed requests along
         with their place in line.

  2. Email dispatch
     - Each time an email is queued, the server is asked to send it straight away.
     - The hourly schedule also retries any email that did not go out.

  3. Security
     - Admin-only functions check the caller is an administrator before acting.
     - Internal functions are not callable by members or anonymous visitors.
     - my_active_requests only returns the caller's own requests. Queue positions
       are counted server-side so members never see other members' details.

  4. Notes
     1. Copies are counted with a row lock so two admins cannot give out the same copy.
     2. The waiting list order is the order requests were created, with the
        request id as a tie-breaker.
*/

CREATE OR REPLACE FUNCTION public.hold_request_for_pickup(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text;
  v_name text;
  v_title text;
  v_deadline timestamptz := now() + interval '7 days';
BEGIN
  SELECT br.requester_email, br.requester_name, lr.title
    INTO v_email, v_name, v_title
    FROM borrow_requests br
    JOIN library_resources lr ON lr.id = br.book_id
   WHERE br.id = p_request_id;

  UPDATE borrow_requests
     SET status = 'ready',
         ready_at = now(),
         pickup_deadline = v_deadline
   WHERE id = p_request_id;

  INSERT INTO loan_emails (borrow_request_id, kind, recipient_email, recipient_name, book_title, pickup_deadline)
  VALUES (p_request_id, 'ready_for_pickup', v_email, COALESCE(v_name, ''), v_title, v_deadline);
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_next_in_line(p_book_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_free integer;
  v_next uuid;
BEGIN
  LOOP
    SELECT available_copies INTO v_free
      FROM library_resources
     WHERE id = p_book_id
       FOR UPDATE;

    EXIT WHEN v_free IS NULL OR v_free < 1;

    SELECT id INTO v_next
      FROM borrow_requests
     WHERE book_id = p_book_id AND status = 'pending'
     ORDER BY created_at, id
     LIMIT 1
       FOR UPDATE SKIP LOCKED;

    EXIT WHEN v_next IS NULL;

    UPDATE library_resources
       SET available_copies = available_copies - 1,
           updated_at = now()
     WHERE id = p_book_id;

    PERFORM public.hold_request_for_pickup(v_next);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_borrow_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_book_id uuid;
  v_free integer;
  v_requested_at timestamptz;
BEGIN
  IF NOT is_current_admin() THEN
    RAISE EXCEPTION 'Only admins can approve borrow requests';
  END IF;

  SELECT book_id, created_at INTO v_book_id, v_requested_at
    FROM borrow_requests
   WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  SELECT available_copies INTO v_free
    FROM library_resources
   WHERE id = v_book_id
     FOR UPDATE;

  IF v_free IS NULL OR v_free < 1 THEN
    RAISE EXCEPTION 'No copies are free yet. This request stays on the waiting list.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM borrow_requests
     WHERE book_id = v_book_id
       AND status = 'pending'
       AND (created_at, id) < (v_requested_at, request_id)
  ) THEN
    RAISE EXCEPTION 'An earlier request is ahead of this one on the waiting list.';
  END IF;

  UPDATE library_resources
     SET available_copies = available_copies - 1,
         updated_at = now()
   WHERE id = v_book_id;

  PERFORM public.hold_request_for_pickup(request_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_borrow_collected(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT is_current_admin() THEN
    RAISE EXCEPTION 'Only admins can record collections';
  END IF;

  UPDATE borrow_requests
     SET status = 'borrowed',
         collected_at = now(),
         due_at = now() + interval '21 days'
   WHERE id = request_id
     AND status = 'ready'
     AND pickup_deadline > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This book is not waiting to be collected, or its pickup window has ended.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_borrow_returned(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_book_id uuid;
BEGIN
  IF NOT is_current_admin() THEN
    RAISE EXCEPTION 'Only admins can record returns';
  END IF;

  UPDATE borrow_requests
     SET status = 'returned',
         returned_at = now()
   WHERE id = request_id
     AND status = 'borrowed'
  RETURNING book_id INTO v_book_id;

  IF v_book_id IS NULL THEN
    RAISE EXCEPTION 'This book is not currently on loan.';
  END IF;

  UPDATE library_resources
     SET available_copies = available_copies + 1,
         updated_at = now()
   WHERE id = v_book_id;

  PERFORM public.assign_next_in_line(v_book_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.release_expired_holds()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT id, book_id
      FROM borrow_requests
     WHERE status = 'ready' AND pickup_deadline < now()
       FOR UPDATE
  LOOP
    UPDATE borrow_requests SET status = 'expired' WHERE id = r.id;

    UPDATE library_resources
       SET available_copies = available_copies + 1,
           updated_at = now()
     WHERE id = r.book_id;

    PERFORM public.assign_next_in_line(r.book_id);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_loan_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  WITH first_due AS (
    UPDATE borrow_requests
       SET first_reminder_sent_at = now()
     WHERE status = 'borrowed'
       AND first_reminder_sent_at IS NULL
       AND collected_at <= now() - interval '7 days'
    RETURNING id, requester_email, requester_name, book_id, due_at
  )
  INSERT INTO loan_emails (borrow_request_id, kind, recipient_email, recipient_name, book_title, due_at)
  SELECT f.id, 'reminder_14_days', f.requester_email, COALESCE(f.requester_name, ''), lr.title, f.due_at
    FROM first_due f
    JOIN library_resources lr ON lr.id = f.book_id;

  WITH second_due AS (
    UPDATE borrow_requests
       SET second_reminder_sent_at = now()
     WHERE status = 'borrowed'
       AND second_reminder_sent_at IS NULL
       AND collected_at <= now() - interval '14 days'
    RETURNING id, requester_email, requester_name, book_id, due_at
  )
  INSERT INTO loan_emails (borrow_request_id, kind, recipient_email, recipient_name, book_title, due_at)
  SELECT s.id, 'reminder_7_days', s.requester_email, COALESCE(s.requester_name, ''), lr.title, s.due_at
    FROM second_due s
    JOIN library_resources lr ON lr.id = s.book_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.run_loan_schedule()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.release_expired_holds();
  PERFORM public.queue_loan_reminders();
  PERFORM public.request_loan_email_dispatch();
END;
$$;

CREATE OR REPLACE FUNCTION public.request_loan_email_dispatch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://kajltiejtcfqqoyueuqj.supabase.co/functions/v1/send-loan-emails',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.loan_emails_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.request_loan_email_dispatch();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS loan_emails_dispatch ON loan_emails;
CREATE TRIGGER loan_emails_dispatch
  AFTER INSERT ON loan_emails
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.loan_emails_after_insert();

CREATE OR REPLACE FUNCTION public.my_active_requests()
RETURNS TABLE (
  request_id uuid,
  book_id uuid,
  request_status text,
  requested_at timestamptz,
  pickup_deadline timestamptz,
  collected_at timestamptz,
  due_at timestamptz,
  queue_position integer,
  book_title text,
  book_author text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    br.id,
    br.book_id,
    br.status,
    br.created_at,
    br.pickup_deadline,
    br.collected_at,
    br.due_at,
    CASE
      WHEN br.status = 'pending' THEN (
        SELECT count(*)::integer
          FROM borrow_requests q
         WHERE q.book_id = br.book_id
           AND q.status = 'pending'
           AND (q.created_at, q.id) <= (br.created_at, br.id)
      )
    END,
    lr.title,
    lr.author
  FROM borrow_requests br
  JOIN library_resources lr ON lr.id = br.book_id
  WHERE br.user_id = auth.uid()
    AND br.status IN ('pending', 'ready', 'borrowed')
  ORDER BY br.created_at;
$$;

REVOKE EXECUTE ON FUNCTION public.hold_request_for_pickup(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_next_in_line(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_expired_holds() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_loan_reminders() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.run_loan_schedule() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.request_loan_email_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.loan_emails_after_insert() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.approve_borrow_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_borrow_request(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.mark_borrow_collected(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_borrow_collected(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.mark_borrow_returned(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_borrow_returned(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.my_active_requests() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_active_requests() TO authenticated;

SELECT cron.schedule(
  'loan-schedule-hourly',
  '0 * * * *',
  $$ SELECT public.run_loan_schedule(); SELECT public.request_loan_email_dispatch(); $$
);
