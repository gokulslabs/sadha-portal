import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { REPORTS, type ReportDef } from "@/lib/reports";

export type ReportRow = Record<string, unknown>;

function sourceDateValue(value: unknown): number {
  const text = String(value ?? "").trim();
  if (!text) return 0;
  const native = Date.parse(text);
  if (Number.isFinite(native)) return native;
  // Zoho commonly emits 31-Aug-2026 and 31-Aug-2026 16:09:57.
  const match = text.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return 0;
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const month = months.indexOf(match[2]!.toLowerCase());
  return month < 0 ? 0 : new Date(Number(match[3]), month, Number(match[1]), Number(match[4] ?? 0), Number(match[5] ?? 0), Number(match[6] ?? 0)).getTime();
}

export function useReportRows(def?: ReportDef) {
  return useQuery({
    queryKey: ["report", def?.slug ?? "none"],
    enabled: Boolean(def),
    queryFn: async (): Promise<ReportRow[]> => {
      if (!def) return [];
      // `id` is kept out of the visible registry, but is needed for Zoho-style
      // inline edit/save behaviour in every report grid.
      const select = ["id", ...def.columns.map((c) => c.key)].join(",");
      // Generic table access — table name is derived from the trusted registry.
      // Supabase caps SELECT at 1000 rows (db-max-rows), so paginate over all
      // records to avoid silently truncating larger reports (e.g. rent entries).
      const PAGE = 1000;
      const all: ReportRow[] = [];
      for (let start = 0; ; start += PAGE) {
        const { data, error } = await supabase
          .from(def.table as never)
          .select(select)
          .range(start, start + PAGE - 1);
        if (error) throw error;
        const rows = (data ?? []) as ReportRow[];
        all.push(...rows);
        if (rows.length < PAGE) break;
      }
      const dateColumn = def.columns.find((column) => ["entry_date", "date_time", "added_time"].includes(column.key));
      if (dateColumn) all.sort((a, b) => sourceDateValue(b[dateColumn.key]) - sourceDateValue(a[dateColumn.key]));
      return all;
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
