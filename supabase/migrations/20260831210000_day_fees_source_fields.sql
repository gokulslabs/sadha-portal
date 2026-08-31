-- Fields present on Zoho's live Add Day Fees Entry form.
ALTER TABLE public.day_fees_entries
  ADD COLUMN IF NOT EXISTS backend numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS diesel_rate_per_liter numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS from_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS to_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mileage numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tank_status text;
