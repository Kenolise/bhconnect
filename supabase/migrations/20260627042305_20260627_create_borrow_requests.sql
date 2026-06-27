/*
# Create borrow_requests table and approve function

## Summary
Adds a borrow request system to the library app. Members can submit requests
to borrow books, and admins can approve or reject them.

## New Tables

### borrow_requests
- `id` (uuid, primary key) — unique request ID
- `book_id` (uuid, FK → library_resources.id) — which book is being requested
- `requester_email` (text, not null) — email of the person requesting
- `requester_name` (text, not null) — name of the person requesting
- `status` (text, not null, default 'pending') — one of: pending, approved, rejected
- `created_at` (timestamptz) — when the request was submitted

## New Functions

### approve_borrow_request(request_id uuid)
Atomically approves a borrow request and decrements available_copies on the book.
Runs as SECURITY DEFINER so it can bypass RLS for the update.

## Security
- RLS enabled on borrow_requests.
- All operations open to anon + authenticated because the app uses localStorage-based
  auth (not Supabase auth), so auth.uid() is always null. Security is enforced at
  the application layer (admin-only UI for reading/updating requests).
*/

CREATE TABLE IF NOT EXISTS borrow_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,
  requester_email text NOT NULL,
  requester_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS borrow_requests_book_id_idx ON borrow_requests(book_id);
CREATE INDEX IF NOT EXISTS borrow_requests_requester_email_idx ON borrow_requests(requester_email);
CREATE INDEX IF NOT EXISTS borrow_requests_status_idx ON borrow_requests(status);

ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_borrow_requests" ON borrow_requests;
CREATE POLICY "anon_select_borrow_requests" ON borrow_requests FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_borrow_requests" ON borrow_requests;
CREATE POLICY "anon_insert_borrow_requests" ON borrow_requests FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_borrow_requests" ON borrow_requests;
CREATE POLICY "anon_update_borrow_requests" ON borrow_requests FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_borrow_requests" ON borrow_requests;
CREATE POLICY "anon_delete_borrow_requests" ON borrow_requests FOR DELETE
TO anon, authenticated USING (true);

-- Atomically approve a request and decrement available_copies on the book.
CREATE OR REPLACE FUNCTION approve_borrow_request(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_book_id uuid;
BEGIN
  SELECT book_id INTO v_book_id
  FROM borrow_requests
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  UPDATE borrow_requests SET status = 'approved' WHERE id = request_id;

  UPDATE library_resources
  SET available_copies = GREATEST(available_copies - 1, 0),
      updated_at = now()
  WHERE id = v_book_id;
END;
$$;
