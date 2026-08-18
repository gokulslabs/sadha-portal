-- Audit log for the entire tyre module
-- Captures INSERT / UPDATE / DELETE on every tyre-related table with:
--   who (auth.uid()), when (now()), what table, which row, and before/after JSON.

CREATE TABLE public.tyre_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tyre_audit_log TO authenticated;
GRANT ALL ON public.tyre_audit_log TO service_role;
ALTER TABLE public.tyre_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can view audit log" ON public.tyre_audit_log FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_tyre_audit_log_table ON public.tyre_audit_log(table_name, changed_at DESC);
CREATE INDEX idx_tyre_audit_log_record ON public.tyre_audit_log(record_id);

-- Generic audit trigger function. table_name is passed via TG_TABLE_NAME.
CREATE OR REPLACE FUNCTION public.log_tyre_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.tyre_audit_log (table_name, record_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'INSERT', row_to_json(NEW)::jsonb, auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.tyre_audit_log (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.tyre_audit_log (table_name, record_id, action, old_data, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id::text, 'DELETE', row_to_json(OLD)::jsonb, auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.log_tyre_audit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_tyre_audit() TO service_role;

-- Attach to every tyre-module table (audit all maintenance changes)
CREATE TRIGGER trg_audit_tyre_inventory AFTER INSERT OR UPDATE OR DELETE ON public.tyre_inventory
  FOR EACH ROW EXECUTE FUNCTION public.log_tyre_audit();
CREATE TRIGGER trg_audit_tyre_fitment AFTER INSERT OR UPDATE OR DELETE ON public.tyre_fitment
  FOR EACH ROW EXECUTE FUNCTION public.log_tyre_audit();
CREATE TRIGGER trg_audit_teeth_purchase AFTER INSERT OR UPDATE OR DELETE ON public.teeth_purchase
  FOR EACH ROW EXECUTE FUNCTION public.log_tyre_audit();
CREATE TRIGGER trg_audit_teeth_fitment AFTER INSERT OR UPDATE OR DELETE ON public.teeth_fitment
  FOR EACH ROW EXECUTE FUNCTION public.log_tyre_audit();
CREATE TRIGGER trg_audit_service_entries AFTER INSERT OR UPDATE OR DELETE ON public.service_entries
  FOR EACH ROW EXECUTE FUNCTION public.log_tyre_audit();
CREATE TRIGGER trg_audit_tyres AFTER INSERT OR UPDATE OR DELETE ON public.tyres
  FOR EACH ROW EXECUTE FUNCTION public.log_tyre_audit();
CREATE TRIGGER trg_audit_tyre_events AFTER INSERT OR UPDATE OR DELETE ON public.tyre_events
  FOR EACH ROW EXECUTE FUNCTION public.log_tyre_audit();
CREATE TRIGGER trg_audit_vehicles AFTER INSERT OR UPDATE OR DELETE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.log_tyre_audit();