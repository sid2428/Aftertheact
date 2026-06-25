-- Schema drift fix: Episode.thumbnail_url is defined in schema.sql but missing
-- from the live DB.
ALTER TABLE "Episode"
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
