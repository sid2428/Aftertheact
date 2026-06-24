-- Migration 2 — Judge table
-- Optional DB-backed judge directory. The running app currently sources judge
-- identity from Redis (panel:members, extended with id/descriptor/instagram/bio),
-- so this table is provided for parity with the spec but is not required for the
-- "Judge the Judges" ratings to function.
CREATE TABLE IF NOT EXISTS "Judge" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  instagram_handle TEXT,
  image_url TEXT,
  bio TEXT,
  descriptor TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
