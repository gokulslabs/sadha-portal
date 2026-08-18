-- Add form-only columns (fields captured by the entry forms but not shown in
-- the report projection) so the forms are fully backed by the schema.

-- Sales Entry
ALTER TABLE public.sales_entries ADD COLUMN IF NOT EXISTS contact_number text;
ALTER TABLE public.sales_entries ADD COLUMN IF NOT EXISTS purchase_rate numeric NOT NULL DEFAULT 0;
ALTER TABLE public.sales_entries ADD COLUMN IF NOT EXISTS purchase_total numeric NOT NULL DEFAULT 0;
ALTER TABLE public.sales_entries ADD COLUMN IF NOT EXISTS purchase_gst numeric NOT NULL DEFAULT 0;
ALTER TABLE public.sales_entries ADD COLUMN IF NOT EXISTS purchase_gst_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.sales_entries ADD COLUMN IF NOT EXISTS purchase_paid numeric NOT NULL DEFAULT 0;
ALTER TABLE public.sales_entries ADD COLUMN IF NOT EXISTS purchase_balance numeric NOT NULL DEFAULT 0;
ALTER TABLE public.sales_entries ADD COLUMN IF NOT EXISTS sales_rate numeric NOT NULL DEFAULT 0;
ALTER TABLE public.sales_entries ADD COLUMN IF NOT EXISTS diesel_source text;
ALTER TABLE public.sales_entries ADD COLUMN IF NOT EXISTS diesel_liters numeric NOT NULL DEFAULT 0;

-- Rent Entry
ALTER TABLE public.rent_entries ADD COLUMN IF NOT EXISTS contact_number text;
ALTER TABLE public.rent_entries ADD COLUMN IF NOT EXISTS gst numeric NOT NULL DEFAULT 0;
ALTER TABLE public.rent_entries ADD COLUMN IF NOT EXISTS rent_gst_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.rent_entries ADD COLUMN IF NOT EXISTS choose_account text;

-- Day Fees Entry
ALTER TABLE public.day_fees_entries ADD COLUMN IF NOT EXISTS transporters text;
ALTER TABLE public.day_fees_entries ADD COLUMN IF NOT EXISTS contact_number text;
ALTER TABLE public.day_fees_entries ADD COLUMN IF NOT EXISTS gst numeric NOT NULL DEFAULT 0;
ALTER TABLE public.day_fees_entries ADD COLUMN IF NOT EXISTS gst_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.day_fees_entries ADD COLUMN IF NOT EXISTS choose_account text;

-- Boulder Entries
ALTER TABLE public.boulder_entries ADD COLUMN IF NOT EXISTS dc_number text;
ALTER TABLE public.boulder_entries ADD COLUMN IF NOT EXISTS delivery_location text;
ALTER TABLE public.boulder_entries ADD COLUMN IF NOT EXISTS shed_work_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.boulder_entries ADD COLUMN IF NOT EXISTS diesel_rate_per_liter numeric NOT NULL DEFAULT 0;
ALTER TABLE public.boulder_entries ADD COLUMN IF NOT EXISTS from_km numeric NOT NULL DEFAULT 0;
ALTER TABLE public.boulder_entries ADD COLUMN IF NOT EXISTS to_km numeric NOT NULL DEFAULT 0;
ALTER TABLE public.boulder_entries ADD COLUMN IF NOT EXISTS tank_status text;
ALTER TABLE public.boulder_entries ADD COLUMN IF NOT EXISTS total_km numeric NOT NULL DEFAULT 0;
ALTER TABLE public.boulder_entries ADD COLUMN IF NOT EXISTS mileage text;