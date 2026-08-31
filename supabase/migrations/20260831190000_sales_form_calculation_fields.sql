-- Remaining fields shown by Zoho's Add Sales Entry form.
ALTER TABLE public.sales_entries
  ADD COLUMN IF NOT EXISTS sales_total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_gst numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_gst_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS choose_account text,
  ADD COLUMN IF NOT EXISTS diesel_rate_per_liter numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS from_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS to_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mileage numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tank_status text,
  ADD COLUMN IF NOT EXISTS total_trip_expense numeric NOT NULL DEFAULT 0;
