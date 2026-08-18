-- ============================================================================
-- Reference-site schema (exact field-for-field replica of the Zoho Creator app)
-- Titles/dates/IDs stored as text (matches the source data formats),
-- amounts/qty/km/balances stored as numeric.
-- ============================================================================

-- --------------------------- MASTER DATA -----------------------------------

CREATE TABLE public.fleet_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id text,
  vehicle_name text,
  zoho_id text,
  vehicle_number text,
  vehicle_category text,
  engine_number text,
  chassis_number text,
  insurance_expiry_date text,
  fc_valid_till text,
  puc_valid_till text,
  road_tax_expiry text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fleet_vehicles TO authenticated;
GRANT ALL ON public.fleet_vehicles TO service_role;
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage fleet_vehicles" ON public.fleet_vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text,
  added_time text,
  client_name text,
  address text,
  email text,
  phone text,
  gstin text,
  opening_balance numeric NOT NULL DEFAULT 0,
  old_balance numeric NOT NULL DEFAULT 0,
  current_balance numeric NOT NULL DEFAULT 0,
  diesel_balance numeric NOT NULL DEFAULT 0,
  total_client_balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage clients" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id text,
  added_time text,
  vendor_name text,
  phone text,
  email text,
  gstin text,
  address text,
  opening_balance numeric NOT NULL DEFAULT 0,
  old_balance numeric NOT NULL DEFAULT 0,
  current_balance numeric NOT NULL DEFAULT 0,
  total_vendor_balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage vendors" ON public.vendors FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id text,
  driver_name text,
  driver_image text,
  phone text,
  license_number text,
  opening_balance numeric NOT NULL DEFAULT 0,
  old_balance numeric NOT NULL DEFAULT 0,
  driver_balance numeric NOT NULL DEFAULT 0,
  total_driver_balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage drivers" ON public.drivers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id text,
  material_name text,
  material_category text,
  material_unit text,
  description text,
  default_sale_rate text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage materials" ON public.materials FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id text,
  machine_name text,
  machine_number text,
  machine_category text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.machines TO authenticated;
GRANT ALL ON public.machines TO service_role;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage machines" ON public.machines FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.transporters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transporter_id text,
  transporter_name text,
  contact_person text,
  phone text,
  email text,
  transporter_balance numeric NOT NULL DEFAULT 0,
  portal_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transporters TO authenticated;
GRANT ALL ON public.transporters TO service_role;
ALTER TABLE public.transporters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage transporters" ON public.transporters FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_name text,
  short_name text,
  zoho_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT ALL ON public.units TO service_role;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage units" ON public.units FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_category_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sub_categories TO authenticated;
GRANT ALL ON public.sub_categories TO service_role;
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage sub_categories" ON public.sub_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.payment_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_categories TO authenticated;
GRANT ALL ON public.payment_categories TO service_role;
ALTER TABLE public.payment_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage payment_categories" ON public.payment_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.company_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text,
  contact_person text,
  email text,
  phone text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_profile TO authenticated;
GRANT ALL ON public.company_profile TO service_role;
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage company_profile" ON public.company_profile FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date text,
  account_type text,
  bank_name text,
  display_name text,
  holder text,
  cash_adjustment numeric NOT NULL DEFAULT 0,
  money_transfer numeric NOT NULL DEFAULT 0,
  current_balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage accounts" ON public.accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --------------------------- ENTRY TABLES ----------------------------------

CREATE TABLE public.diesel_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zoho_id text,
  source text,
  entry_date text,
  driver text,
  vehicle text,
  diesel_liters numeric NOT NULL DEFAULT 0,
  diesel_rate_per_liter numeric NOT NULL DEFAULT 0,
  diesel_amount numeric NOT NULL DEFAULT 0,
  mileage text,
  tank_status text,
  rec_from text,
  from_km numeric NOT NULL DEFAULT 0,
  to_km numeric NOT NULL DEFAULT 0,
  total_km numeric NOT NULL DEFAULT 0,
  dc_number text,
  added_user text,
  added_time text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diesel_entries TO authenticated;
GRANT ALL ON public.diesel_entries TO service_role;
ALTER TABLE public.diesel_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage diesel_entries" ON public.diesel_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_diesel_entries_date ON public.diesel_entries(entry_date);

CREATE TABLE public.def_oil_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zoho_id text,
  date_time text,
  transporters text,
  vehicle text,
  driver text,
  source text,
  def_oil_per_liter numeric NOT NULL DEFAULT 0,
  def_oil_liters numeric NOT NULL DEFAULT 0,
  def_oil_amount numeric NOT NULL DEFAULT 0,
  rec_from text,
  mileage text,
  from_km numeric NOT NULL DEFAULT 0,
  to_km numeric NOT NULL DEFAULT 0,
  total_km numeric NOT NULL DEFAULT 0,
  bunk_reference text,
  tank_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.def_oil_entries TO authenticated;
GRANT ALL ON public.def_oil_entries TO service_role;
ALTER TABLE public.def_oil_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage def_oil_entries" ON public.def_oil_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.sales_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_id text,
  dc_no text,
  entry_date text,
  transporters text,
  purchase_from text,
  client_name text,
  delivery_location text,
  vehicle text,
  driver text,
  purchase_quantity numeric NOT NULL DEFAULT 0,
  materials text,
  purchase_unit text,
  purchase_net_total numeric NOT NULL DEFAULT 0,
  sales_quantity numeric NOT NULL DEFAULT 0,
  sales_unit text,
  sales_net_total numeric NOT NULL DEFAULT 0,
  driver_padi numeric NOT NULL DEFAULT 0,
  driver_food_amount numeric NOT NULL DEFAULT 0,
  shed_work_amount numeric NOT NULL DEFAULT 0,
  total_vehicle_expense numeric NOT NULL DEFAULT 0,
  driver_advance numeric NOT NULL DEFAULT 0,
  driver_net_total numeric NOT NULL DEFAULT 0,
  diesel_amount numeric NOT NULL DEFAULT 0,
  profit numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_entries TO authenticated;
GRANT ALL ON public.sales_entries TO service_role;
ALTER TABLE public.sales_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage sales_entries" ON public.sales_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.rent_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rent_entry_id text,
  entry_date text,
  dc_no text,
  transporters text,
  purchase_from text,
  material text,
  quantity numeric NOT NULL DEFAULT 0,
  unit text,
  client_name text,
  delivery_location text,
  rent_quantity numeric NOT NULL DEFAULT 0,
  rent_price numeric NOT NULL DEFAULT 0,
  rent_amount numeric NOT NULL DEFAULT 0,
  rent_amount_with_gst numeric NOT NULL DEFAULT 0,
  vehicle_number text,
  driver_name text,
  driver_padi numeric NOT NULL DEFAULT 0,
  driver_food_amount numeric NOT NULL DEFAULT 0,
  shed_work_amount numeric NOT NULL DEFAULT 0,
  total_vehicle_expense numeric NOT NULL DEFAULT 0,
  driver_advance numeric NOT NULL DEFAULT 0,
  driver_net_total numeric NOT NULL DEFAULT 0,
  diesel_source text,
  diesel_liters numeric NOT NULL DEFAULT 0,
  from_km numeric NOT NULL DEFAULT 0,
  to_km numeric NOT NULL DEFAULT 0,
  total_km numeric NOT NULL DEFAULT 0,
  mileage text,
  tank_status text,
  bunk_reference text,
  diesel_rate_per_liter numeric NOT NULL DEFAULT 0,
  diesel_amount numeric NOT NULL DEFAULT 0,
  total_trip_expense numeric NOT NULL DEFAULT 0,
  profit numeric NOT NULL DEFAULT 0,
  zoho_id text,
  modified_user text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rent_entries TO authenticated;
GRANT ALL ON public.rent_entries TO service_role;
ALTER TABLE public.rent_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage rent_entries" ON public.rent_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.day_fees_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zoho_id text,
  dc_number text,
  entry_date text,
  purchase_from text,
  client_name text,
  delivery_location text,
  material text,
  unit text,
  quantity numeric NOT NULL DEFAULT 0,
  total_load numeric NOT NULL DEFAULT 0,
  vehicle_number text,
  driver_name text,
  per_day_amount numeric NOT NULL DEFAULT 0,
  amount_with_gst numeric NOT NULL DEFAULT 0,
  driver_padi numeric NOT NULL DEFAULT 0,
  driver_food_amount numeric NOT NULL DEFAULT 0,
  shed_work_amount numeric NOT NULL DEFAULT 0,
  driver_advance numeric NOT NULL DEFAULT 0,
  driver_net_total numeric NOT NULL DEFAULT 0,
  diesel_source text,
  diesel_liters numeric NOT NULL DEFAULT 0,
  diesel_amount numeric NOT NULL DEFAULT 0,
  bunk_reference text,
  total_vehicle_expense numeric NOT NULL DEFAULT 0,
  total_trip_expense numeric NOT NULL DEFAULT 0,
  profit numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.day_fees_entries TO authenticated;
GRANT ALL ON public.day_fees_entries TO service_role;
ALTER TABLE public.day_fees_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage day_fees_entries" ON public.day_fees_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.boulder_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zoho_id text,
  entry_date text,
  boulder_shift text,
  business_transporters text,
  client_name text,
  unit text,
  boulders_source text,
  total_loads numeric NOT NULL DEFAULT 0,
  total_tons numeric NOT NULL DEFAULT 0,
  ton_per_rate numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  gst numeric NOT NULL DEFAULT 0,
  gst_amount numeric NOT NULL DEFAULT 0,
  amount_with_gst numeric NOT NULL DEFAULT 0,
  vehicle_number text,
  driver_name text,
  driver_padi numeric NOT NULL DEFAULT 0,
  driver_food_amount numeric NOT NULL DEFAULT 0,
  driver_advance numeric NOT NULL DEFAULT 0,
  choose_account text,
  driver_net_total numeric NOT NULL DEFAULT 0,
  total_vehicle_expense numeric NOT NULL DEFAULT 0,
  diesel_source text,
  diesel_liters numeric NOT NULL DEFAULT 0,
  diesel_amount numeric NOT NULL DEFAULT 0,
  bunk_reference text,
  total_trip_expense numeric NOT NULL DEFAULT 0,
  profit numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boulder_entries TO authenticated;
GRANT ALL ON public.boulder_entries TO service_role;
ALTER TABLE public.boulder_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage boulder_entries" ON public.boulder_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.boulder_diesel_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zoho_id text,
  source text,
  entry_date text,
  vehicle text,
  driver text,
  diesel_rate_per_liter numeric NOT NULL DEFAULT 0,
  diesel_liters numeric NOT NULL DEFAULT 0,
  mileage text,
  diesel_amount numeric NOT NULL DEFAULT 0,
  bunk_reference text,
  tank_status text,
  rec_from text,
  boulders_entries text,
  dc_number text,
  added_user text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boulder_diesel_entries TO authenticated;
GRANT ALL ON public.boulder_diesel_entries TO service_role;
ALTER TABLE public.boulder_diesel_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage boulder_diesel_entries" ON public.boulder_diesel_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.excavator_daily_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zoho_id text,
  entry_date text,
  client text,
  loads_per_day numeric NOT NULL DEFAULT 0,
  ton_per_day numeric NOT NULL DEFAULT 0,
  ton_per_rate numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  gst numeric NOT NULL DEFAULT 0,
  gst_amount numeric NOT NULL DEFAULT 0,
  amount_with_gst numeric NOT NULL DEFAULT 0,
  diesel_source text,
  bunk_reference text,
  diesel_liters numeric NOT NULL DEFAULT 0,
  diesel_rate numeric NOT NULL DEFAULT 0,
  diesel_amount numeric NOT NULL DEFAULT 0,
  profit numeric NOT NULL DEFAULT 0,
  added_time text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.excavator_daily_entries TO authenticated;
GRANT ALL ON public.excavator_daily_entries TO service_role;
ALTER TABLE public.excavator_daily_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage excavator_daily_entries" ON public.excavator_daily_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.excavator_rent_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rent_id text,
  entry_date text,
  machine text,
  driver text,
  client text,
  start_hour numeric NOT NULL DEFAULT 0,
  end_hour numeric NOT NULL DEFAULT 0,
  total_hour numeric NOT NULL DEFAULT 0,
  rate_per_hour numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  gst numeric NOT NULL DEFAULT 0,
  gst_amount numeric NOT NULL DEFAULT 0,
  amount_with_gst numeric NOT NULL DEFAULT 0,
  diesel_source text,
  diesel_filling_l numeric NOT NULL DEFAULT 0,
  diesel_rate_per_liter numeric NOT NULL DEFAULT 0,
  diesel_amount numeric NOT NULL DEFAULT 0,
  tank_status text,
  bunk_reference text,
  mileage text,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.excavator_rent_entries TO authenticated;
GRANT ALL ON public.excavator_rent_entries TO service_role;
ALTER TABLE public.excavator_rent_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage excavator_rent_entries" ON public.excavator_rent_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.excavator_diesel_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zoho_id text,
  entry_date text,
  source text,
  machine text,
  driver text,
  diesel_liters numeric NOT NULL DEFAULT 0,
  diesel_rate_per_liter numeric NOT NULL DEFAULT 0,
  diesel_amount numeric NOT NULL DEFAULT 0,
  mileage text,
  tank_status text,
  rec_from text,
  bunk_reference text,
  added_user text,
  dc_number text,
  excavator_rent_entry_id text,
  excavator_id text,
  excavator_daily_entry_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.excavator_diesel_entries TO authenticated;
GRANT ALL ON public.excavator_diesel_entries TO service_role;
ALTER TABLE public.excavator_diesel_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage excavator_diesel_entries" ON public.excavator_diesel_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.income_expense_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text,
  type text,
  date_time text,
  account text,
  payment_for text,
  category text,
  remarks text,
  income numeric NOT NULL DEFAULT 0,
  expense numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.income_expense_entries TO authenticated;
GRANT ALL ON public.income_expense_entries TO service_role;
ALTER TABLE public.income_expense_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage income_expense_entries" ON public.income_expense_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);