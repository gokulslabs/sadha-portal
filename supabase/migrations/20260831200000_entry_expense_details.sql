-- Child expense tables displayed in the Zoho transport-entry workflows.
ALTER TABLE public.sales_entries
  ADD COLUMN IF NOT EXISTS vehicle_expense_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS trip_expense_details jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.rent_entries
  ADD COLUMN IF NOT EXISTS vehicle_expense_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS trip_expense_details jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.day_fees_entries
  ADD COLUMN IF NOT EXISTS vehicle_expense_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS trip_expense_details jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.boulder_entries
  ADD COLUMN IF NOT EXISTS vehicle_expense_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS trip_expense_details jsonb NOT NULL DEFAULT '[]'::jsonb;
