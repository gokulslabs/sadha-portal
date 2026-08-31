-- The source Excavators form exposes this related-reference field in its diesel section.
ALTER TABLE public.excavator_entries
  ADD COLUMN IF NOT EXISTS bunk_reference text;
