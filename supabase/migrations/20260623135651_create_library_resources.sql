/*
# Create library resources table (single-tenant, no auth)

## Summary
Creates the `library_resources` table that powers the Library tab in the BH Connect app.
Users can browse, search, filter, and add resource entries for Believers House.

## New Tables
- `library_resources`
  - `id` (uuid, primary key)
  - `title` (text, not null) — name of the resource
  - `author` (text) — author or speaker
  - `category` (text, not null) — e.g. "Book", "Sermon", "Study Guide", "Article"
  - `description` (text) — short summary
  - `url` (text) — optional link to the resource
  - `cover_color` (text) — hex color for the card accent
  - `created_at` (timestamptz) — row creation timestamp
  - `updated_at` (timestamptz) — row modification timestamp

## Indexes
- Index on `category` for filter queries
- Index on `created_at` for sorting by newest

## Security
- RLS enabled on `library_resources`.
- Allow anon + authenticated CRUD because the data is intentionally shared/public (community library, no sign-in required).

## Notes
1. This is a single-tenant community library — there are no user accounts yet.
2. All four CRUD verbs have separate policies (no `FOR ALL`).
3. The `updated_at` trigger keeps the modification timestamp current on every update.
*/

CREATE TABLE IF NOT EXISTS library_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text,
  category text NOT NULL DEFAULT 'Book',
  description text,
  url text,
  cover_color text DEFAULT '#d4af37',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_library_resources_category ON library_resources(category);
CREATE INDEX IF NOT EXISTS idx_library_resources_created_at ON library_resources(created_at DESC);

ALTER TABLE library_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_library" ON library_resources;
CREATE POLICY "anon_select_library" ON library_resources FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_library" ON library_resources;
CREATE POLICY "anon_insert_library" ON library_resources FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_library" ON library_resources;
CREATE POLICY "anon_update_library" ON library_resources FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_library" ON library_resources;
CREATE POLICY "anon_delete_library" ON library_resources FOR DELETE
  TO anon, authenticated USING (true);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_library_resources_updated_at ON library_resources;
CREATE TRIGGER trg_library_resources_updated_at
  BEFORE UPDATE ON library_resources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed sample data
INSERT INTO library_resources (title, author, category, description, url, cover_color) VALUES
  ('The Purpose Driven Life', 'Rick Warren', 'Book', 'A forty-day spiritual journey to discover God''s purpose for your life.', NULL, '#d4af37'),
  ('Mere Christianity', 'C.S. Lewis', 'Book', 'A classic defense of the Christian faith, adapted from WWII radio broadcasts.', NULL, '#c0a06e'),
  ('Knowing God', 'J.I. Packer', 'Book', 'An exploration of who God is and what it means to know Him personally.', NULL, '#b08d57'),
  ('Believers House Vision Series', 'Pastor James MacIntyre', 'Sermon', 'A foundational series on the vision and values of our church family.', 'https://believershouse.church', '#d4af37'),
  ('Grace in Action Study Guide', 'Believers House Team', 'Study Guide', 'A twelve-week small group study walking through the book of Ephesians.', 'https://believershouse.church', '#e0c576'),
  ('Heavenly Worship: A Devotional', 'Sarah Thompson', 'Article', 'A thirty-day devotional on what it means to worship in spirit and in truth.', NULL, '#c39a1f'),
  ('The Cost of Discipleship', 'Dietrich Bonhoeffer', 'Book', 'A profound meditation on what it truly means to follow Christ.', NULL, '#a37d16'),
  ('Foundations of Prayer', 'Pastor James MacIntyre', 'Sermon', 'A practical teaching on building a vibrant personal prayer life.', 'https://believershouse.church', '#d4af37')
ON CONFLICT DO NOTHING;
