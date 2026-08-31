-- Source form metadata retained alongside the imported daily-entry values.
ALTER TABLE public.excavator_daily_entries
  ADD COLUMN IF NOT EXISTS business_transporters text;
