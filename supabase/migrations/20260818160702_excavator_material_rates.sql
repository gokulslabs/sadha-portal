-- Two remaining reference reports not captured in the initial extract.
-- Excavators Entries (All_Excavators_Entries) + Material Rates (All_Vendor_Material_Rates).

CREATE TABLE public.excavator_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zoho_id text,
  entry_date text,
  excavator text,
  shift text,
  client text,
  vehicle text,
  material text,
  loads numeric NOT NULL DEFAULT 0,
  tons numeric NOT NULL DEFAULT 0,
  rate numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.excavator_entries TO authenticated;
GRANT ALL ON public.excavator_entries TO service_role;
ALTER TABLE public.excavator_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage excavator_entries" ON public.excavator_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.material_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name text,
  material text,
  unit text,
  rate numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_rates TO authenticated;
GRANT ALL ON public.material_rates TO service_role;
ALTER TABLE public.material_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage material_rates" ON public.material_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);