ALTER TABLE public.boulder_diesel_entries
  ADD COLUMN IF NOT EXISTS from_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS to_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_km numeric NOT NULL DEFAULT 0;
