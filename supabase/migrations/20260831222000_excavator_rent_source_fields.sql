-- Fields exposed in the live Excavators Rent Entries form.
ALTER TABLE public.excavator_rent_entries
  ADD COLUMN IF NOT EXISTS business_transporters text,
  ADD COLUMN IF NOT EXISTS dc_number text;
