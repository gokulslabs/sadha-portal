CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number text NOT NULL,
  wheels int NOT NULL DEFAULT 6,
  odometer numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users manage vehicles" ON public.vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.tyres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  position_code text NOT NULL,
  axle_label text,
  serial_no text,
  brand text,
  tyre_type text NOT NULL DEFAULT 'New',
  fitted_on date,
  fitted_km numeric NOT NULL DEFAULT 0,
  current_km numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'running',
  remark text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vehicle_id, position_code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tyres TO authenticated;
GRANT ALL ON public.tyres TO service_role;
ALTER TABLE public.tyres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users manage tyres" ON public.tyres FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.tyre_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tyre_id uuid NOT NULL REFERENCES public.tyres(id) ON DELETE CASCADE,
  event_date date NOT NULL DEFAULT current_date,
  event_type text NOT NULL,
  km_reading numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tyre_events TO authenticated;
GRANT ALL ON public.tyre_events TO service_role;
ALTER TABLE public.tyre_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users manage tyre events" ON public.tyre_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_tyres_vehicle ON public.tyres(vehicle_id);
CREATE INDEX idx_tyre_events_tyre ON public.tyre_events(tyre_id);

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tyres_updated_at BEFORE UPDATE ON public.tyres FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.vehicles (vehicle_number, wheels, odometer) VALUES
  ('MH12TV1254', 10, 248500),
  ('MH12AB4477', 6, 132400),
  ('MH14TR9021', 22, 415900);