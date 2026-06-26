-- Onboarding: users pick a real display name + bio after first login.
-- Until then they carry an auto-generated temp username (u_<8 hex>), which is
-- what was leaking onto the Prophet's Wall instead of a human name.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS onboarded BOOLEAN NOT NULL DEFAULT false;

-- Anyone who already has a real (non-temp) username has effectively onboarded —
-- don't drag them through the prompt. Only the u_<hex> temp names get flagged.
UPDATE "User"
SET onboarded = true
WHERE username !~ '^u_[0-9a-f]{8}$';
