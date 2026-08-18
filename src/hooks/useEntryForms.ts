import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EntryFormDef, FormField } from "@/lib/entryForms";

export type FormValues = Record<string, string>;

export function fieldInputType(field: FormField): string {
  if (field.type === "number" || field.type === "currency") return "number";
  if (field.type === "date") return "date";
  return "text";
}

/** Coerce a string form value into the DB type (numeric cols stay numbers). */
export function coerceValue(field: FormField, raw: string): string | number | null {
  const value = raw.trim();
  if (field.type === "number" || field.type === "currency") {
    if (value === "") return 0;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (value === "") return null;
  return value;
}

export function useSubmitEntryForm(def: EntryFormDef) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: FormValues) => {
      const payload: Record<string, string | number | null> = {};
      for (const section of def.sections) {
        for (const field of section.fields) {
          if (field.key in values) payload[field.key] = coerceValue(field, values[field.key]!);
        }
      }
      // Insert into the table (trusted registry-derived table name).
      const { error } = await supabase.from(def.table as never).insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate any report query whose table matches this form.
      qc.invalidateQueries({ queryKey: ["report"] });
    },
  });
}