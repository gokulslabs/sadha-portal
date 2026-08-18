-- Tyre Inventory (purchase/stock ledger: new / mines / retrading)
CREATE TABLE public.tyre_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type text NOT NULL DEFAULT 'new',
  entry_date date NOT NULL DEFAULT current_date,
  brand text,
  tyre_no text,
  tyre_size text,
  quantity numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tyre_inventory TO authenticated;
GRANT ALL ON public.tyre_inventory TO service_role;
ALTER TABLE public.tyre_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users manage tyre inventory" ON public.tyre_inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tyre Fitment (fitment record incl. old tyre status/stock)
CREATE TABLE public.tyre_fitment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT current_date,
  brand text,
  tyre_no text,
  tyre_size text,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_name text,
  tyre_place text,
  km numeric NOT NULL DEFAULT 0,
  remarks text,
  old_tyre_status text NOT NULL DEFAULT 'NEW',
  old_tyre_stock text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tyre_fitment TO authenticated;
GRANT ALL ON public.tyre_fitment TO service_role;
ALTER TABLE public.tyre_fitment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users manage tyre fitment" ON public.tyre_fitment FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_tyre_fitment_vehicle ON public.tyre_fitment(vehicle_id);

-- Excavator Teeth Purchase / Stock
CREATE TABLE public.teeth_purchase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT current_date,
  purchase_shop text,
  teeth_model text,
  rock_teeth numeric NOT NULL DEFAULT 0,
  washer numeric NOT NULL DEFAULT 0,
  lock_pin numeric NOT NULL DEFAULT 0,
  qty numeric NOT NULL DEFAULT 0,
  storage_place text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teeth_purchase TO authenticated;
GRANT ALL ON public.teeth_purchase TO service_role;
ALTER TABLE public.teeth_purchase ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users manage teeth purchases" ON public.teeth_purchase FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Excavator Teeth Fitment / Usage
CREATE TABLE public.teeth_fitment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT current_date,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  new_teeth_qty numeric NOT NULL DEFAULT 0,
  incharge_name text,
  operator_name text,
  km numeric NOT NULL DEFAULT 0,
  hours numeric NOT NULL DEFAULT 0,
  place text,
  old_teeth_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teeth_fitment TO authenticated;
GRANT ALL ON public.teeth_fitment TO service_role;
ALTER TABLE public.teeth_fitment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users manage teeth fitment" ON public.teeth_fitment FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_teeth_fitment_vehicle ON public.teeth_fitment(vehicle_id);

-- Tyre / Vehicle Service & Repair Log
CREATE TABLE public.service_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT current_date,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_name text,
  from_km numeric NOT NULL DEFAULT 0,
  to_km numeric NOT NULL DEFAULT 0,
  particular text,
  place text,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_entries TO authenticated;
GRANT ALL ON public.service_entries TO service_role;
ALTER TABLE public.service_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users manage service entries" ON public.service_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_service_entries_vehicle ON public.service_entries(vehicle_id);

-- Updated-at triggers (reuses public.update_updated_at_column() from the base migration)
CREATE TRIGGER update_tyre_inventory_updated_at BEFORE UPDATE ON public.tyre_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tyre_fitment_updated_at BEFORE UPDATE ON public.tyre_fitment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teeth_purchase_updated_at BEFORE UPDATE ON public.teeth_purchase FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teeth_fitment_updated_at BEFORE UPDATE ON public.teeth_fitment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_entries_updated_at BEFORE UPDATE ON public.service_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();