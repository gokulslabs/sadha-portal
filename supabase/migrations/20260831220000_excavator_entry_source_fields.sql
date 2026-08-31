-- Fields shown by the live Zoho "Excavators" entry form.
-- Keep the older imported columns intact for historical compatibility.
ALTER TABLE public.excavator_entries
  ADD COLUMN IF NOT EXISTS business_transporters text,
  ADD COLUMN IF NOT EXISTS machine text,
  ADD COLUMN IF NOT EXISTS dc_number text,
  ADD COLUMN IF NOT EXISTS driver text,
  ADD COLUMN IF NOT EXISTS start_hour numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS end_hour numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS starting_diesel_l numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS filling_diesel_l numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ending_diesel_l numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS diesel_source text,
  ADD COLUMN IF NOT EXISTS diesel_rate_per_liter numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS diesel_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tank_status text,
  ADD COLUMN IF NOT EXISTS total_hour numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_diesel_l numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mileage numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS load_count numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS diesel_per_load numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remarks text;
