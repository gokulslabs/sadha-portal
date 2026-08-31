-- Complete the field model exposed by the four Zoho Creator operational forms.
ALTER TABLE public.sales_entries
  ADD COLUMN IF NOT EXISTS contact_number text,
  ADD COLUMN IF NOT EXISTS purchase_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_gst numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_gst_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_paid numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS diesel_source text,
  ADD COLUMN IF NOT EXISTS diesel_liters numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS report_for text,
  ADD COLUMN IF NOT EXISTS report_from text,
  ADD COLUMN IF NOT EXISTS report_to text;

ALTER TABLE public.rent_entries
  ADD COLUMN IF NOT EXISTS contact_number text,
  ADD COLUMN IF NOT EXISTS rent_gst numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rent_gst_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS choose_account text,
  ADD COLUMN IF NOT EXISTS report_for text,
  ADD COLUMN IF NOT EXISTS report_from text,
  ADD COLUMN IF NOT EXISTS report_to text;

ALTER TABLE public.day_fees_entries
  ADD COLUMN IF NOT EXISTS transporters text,
  ADD COLUMN IF NOT EXISTS contact_number text,
  ADD COLUMN IF NOT EXISTS gst numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS choose_account text,
  ADD COLUMN IF NOT EXISTS report_for text,
  ADD COLUMN IF NOT EXISTS report_from text,
  ADD COLUMN IF NOT EXISTS report_to text;

ALTER TABLE public.boulder_entries
  ADD COLUMN IF NOT EXISTS dc_number text,
  ADD COLUMN IF NOT EXISTS delivery_location text,
  ADD COLUMN IF NOT EXISTS shed_work_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS diesel_rate_per_liter numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS from_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS to_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tank_status text,
  ADD COLUMN IF NOT EXISTS mileage text,
  ADD COLUMN IF NOT EXISTS report_for text,
  ADD COLUMN IF NOT EXISTS report_from text,
  ADD COLUMN IF NOT EXISTS report_to text;
