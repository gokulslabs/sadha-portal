import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { REPORTS, type ReportDef } from "@/lib/reports";

export type ReportRow = Record<string, unknown>;

export function useReportRows(def?: ReportDef) {
  return useQuery({
    queryKey: ["report", def?.slug ?? "none"],
    enabled: Boolean(def),
    queryFn: async (): Promise<ReportRow[]> => {
      if (!def) return [];
      const select = def.columns.map((c) => c.key).join(",");
      // Generic table access — table name is derived from the trusted registry.
      const { data, error } = await supabase
        .from(def.table as never)
        .select(select)
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as ReportRow[];
    },
  });
}

export function formatCell(cell: unknown, numeric?: boolean): string {
  if (cell === null || cell === undefined || cell === "") return "";
  if (numeric) {
    const n = Number(cell);
    if (!Number.isFinite(n)) return String(cell);
    return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }
  return String(cell);
}

export type ReportCount = { slug: string; label: string; table: string; count: number };

export function useReportCounts() {
  return useQuery({
    queryKey: ["report-counts"],
    queryFn: async (): Promise<ReportCount[]> => {
      const entries = await Promise.all(
        REPORTS.map(async (r) => {
          const { count, error } = await supabase
            .from(r.table as never)
            .select("*", { count: "exact", head: true });
          return {
            slug: r.slug,
            label: r.label,
            table: r.table,
            count: error ? 0 : count ?? 0,
          };
        }),
      );
      return entries;
    },
  });
}

export function exportRowsCsv(def: ReportDef, rows: ReportRow[]) {
  const header = def.columns.map((c) => c.label);
  const body = rows.map((row) => def.columns.map((c) => formatCell(row[c.key], c.numeric)));
  const csv = [header, ...body]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${def.slug}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}