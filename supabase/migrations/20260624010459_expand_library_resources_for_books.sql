-- Expand library_resources to support physical book inventory + ISBN import

ALTER TABLE library_resources
  ADD COLUMN IF NOT EXISTS isbn text,
  ADD COLUMN IF NOT EXISTS christian_topic text NOT NULL DEFAULT 'Uncategorized',
  ADD COLUMN IF NOT EXISTS total_copies integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS available_copies integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS publisher text,
  ADD COLUMN IF NOT EXISTS publish_year text,
  ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Unique index on ISBN to prevent duplicate imports (null ISBNs are excluded from uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS idx_library_resources_isbn
  ON library_resources(isbn)
  WHERE isbn IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_library_resources_christian_topic
  ON library_resources(christian_topic);

-- Constraint: available_copies cannot exceed total_copies or go below 0
ALTER TABLE library_resources
  DROP CONSTRAINT IF EXISTS chk_copies_valid;
ALTER TABLE library_resources
  ADD CONSTRAINT chk_copies_valid CHECK (
    available_copies >= 0 AND available_copies <= total_copies
  );
