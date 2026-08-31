ALTER TABLE public.excavator_diesel_entries
  ADD COLUMN IF NOT EXISTS sales_entry_id text,
  ADD COLUMN IF NOT EXISTS rent_entry_id text,
  ADD COLUMN IF NOT EXISTS day_fees_entry_id text,
  ADD COLUMN IF NOT EXISTS boulders_entries text,
  ADD COLUMN IF NOT EXISTS business_transporters text,
  ADD COLUMN IF NOT EXISTS vehicle text,
  ADD COLUMN IF NOT EXISTS from_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS to_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_km numeric NOT NULL DEFAULT 0;
