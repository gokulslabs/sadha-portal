ALTER TABLE public.diesel_entries
  ADD COLUMN IF NOT EXISTS sales_entry_id text,
  ADD COLUMN IF NOT EXISTS rent_entry_id text,
  ADD COLUMN IF NOT EXISTS day_fees_entry_id text,
  ADD COLUMN IF NOT EXISTS excavator_id text,
  ADD COLUMN IF NOT EXISTS excavator_rent_entry_id text,
  ADD COLUMN IF NOT EXISTS excavator_daily_entry_id text,
  ADD COLUMN IF NOT EXISTS boulders_entries text,
  ADD COLUMN IF NOT EXISTS business_transporters text,
  ADD COLUMN IF NOT EXISTS machine text,
  ADD COLUMN IF NOT EXISTS bunk_reference text;
