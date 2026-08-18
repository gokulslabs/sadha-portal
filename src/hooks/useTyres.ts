import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { positionSortKey, tyrePositions } from "@/lib/tyres";

export type Vehicle = Tables<"vehicles">;
export type Tyre = Tables<"tyres">;
export type TyreEvent = Tables<"tyre_events">;

const sortTyres = (rows: Tyre[]) =>
  [...rows].sort((a, b) => {
    const [aa, ab] = positionSortKey(a.position_code);
    const [ba, bb] = positionSortKey(b.position_code);
    return aa - ba || ab.localeCompare(bb);
  });

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async (): Promise<Vehicle[]> => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("vehicle_number");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTyres(vehicleId?: string) {
  return useQuery({
    queryKey: ["tyres", vehicleId ?? "none"],
    enabled: Boolean(vehicleId),
    queryFn: async (): Promise<Tyre[]> => {
      const { data, error } = await supabase
        .from("tyres")
        .select("*")
        .eq("vehicle_id", vehicleId!);
      if (error) throw error;
      return sortTyres(data ?? []);
    },
  });
}

export function useAllTyres() {
  return useQuery({
    queryKey: ["tyres", "all"],
    queryFn: async (): Promise<Tyre[]> => {
      const { data, error } = await supabase.from("tyres").select("*");
      if (error) throw error;
      return sortTyres(data ?? []);
    },
  });
}

/** Inserts only the missing positions for the vehicle's wheel count. Idempotent. */
export function useProvisionTyres() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vehicle: Vehicle): Promise<number> => {
      const { data: existing, error: readError } = await supabase
        .from("tyres")
        .select("position_code")
        .eq("vehicle_id", vehicle.id);
      if (readError) throw readError;
      const have = new Set((existing ?? []).map((t) => t.position_code));
      const rows: TablesInsert<"tyres">[] = tyrePositions(vehicle.wheels)
        .filter((p) => !have.has(p.pos))
        .map((p) => ({
          vehicle_id: vehicle.id,
          position_code: p.pos,
          axle_label: p.axle,
        }));
      if (rows.length === 0) return 0;
      const { error } = await supabase.from("tyres").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tyres"] }),
  });
}

export type TyreUpdate = {
  id: string;
  tyre_type?: string;
  brand?: string | null;
  serial_no?: string | null;
  current_km?: number;
  cost?: number;
  status?: string;
  fitted_on?: string | null;
  remark?: string | null;
};

export function useSaveTyre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: TyreUpdate) => {
      const { data, error } = await supabase
        .from("tyres")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tyres"] }),
  });
}

export function useTyreEvents(tyreId?: string) {
  return useQuery({
    queryKey: ["tyre-events", tyreId ?? "none"],
    enabled: Boolean(tyreId),
    queryFn: async (): Promise<TyreEvent[]> => {
      const { data, error } = await supabase
        .from("tyre_events")
        .select("*")
        .eq("tyre_id", tyreId!)
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddTyreEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (row: TablesInsert<"tyre_events">) => {
      const { error } = await supabase.from("tyre_events").insert(row);
      if (error) throw error;
    },
    onSuccess: (_d, row) => {
      queryClient.invalidateQueries({ queryKey: ["tyre-events", row.tyre_id] });
      queryClient.invalidateQueries({ queryKey: ["tyres"] });
    },
  });
}
