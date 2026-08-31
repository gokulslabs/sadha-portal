import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Download, Printer, Loader2, Power, PowerOff, ArrowUpDown, SlidersHorizontal, Columns3 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { findPage } from "@/lib/nav";
import { findReport } from "@/lib/reports";
import {
  ENTRY_FORM_BY_SLUG,
  REPORT_TO_FORM,
  type EntryFormDef,
  type FormField,
} from "@/lib/entryForms";
import { useReportRows, useReportCounts, formatCell, exportRowsCsv, type ReportRow } from "@/hooks/useReportData";
import { useSubmitEntryForm, fieldInputType } from "@/hooks/useEntryForms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/p/$")({
  head: ({ params }) => {
    const page = findPage(String(params._splat ?? ""));
    const title = `${page?.label ?? "Page"} | Sadha Groups Portal`;
    const description = `${page?.label ?? "Records"} management for Sadha Groups transport, diesel, boulders and excavator operations.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: PageView,
});

function matches(row: ReportRow, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(needle));
}

function reportDate(value: unknown): string {
  const text = String(value ?? "").trim();
  const match = text.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
  if (match) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const month = months.indexOf(match[2]!.toLowerCase());
    return month < 0 ? "" : `${match[3]}-${String(month + 1).padStart(2, "0")}-${String(match[1]).padStart(2, "0")}`;
  }
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : "";
}

/* ---------- Config-driven sectioned entry form ---------- */
function FormFieldControl({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  if (field.type === "radio" && field.options) {
    return (
      <div className="flex gap-4 pt-2">
        {field.options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={field.key}
              checked={value === opt}
              onChange={() => onChange(field.key, opt)}
              className="h-4 w-4"
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <select value={value} onChange={(event) => onChange(field.key, event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm">
        <option value="">-Select-</option>
        {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }

  return (
    <Input
      type={fieldInputType(field)}
      value={value}
      placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}`}
      onChange={(e) => onChange(field.key, e.target.value)}
      className="h-10"
    />
  );
}

function EntryFormView({ def }: { def: EntryFormDef }) {
  const submit = useSubmitEntryForm(def);
  const [values, setValues] = useState<Record<string, string>>({});

  function onChange(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Basic required-field validation
    for (const section of def.sections) {
      for (const field of section.fields) {
        if (field.required && !(values[field.key] ?? "").trim()) {
          toast.error(`${field.label} is required`);
          return;
        }
      }
    }
    try {
      await submit.mutateAsync(values);
      toast.success("Entry saved successfully");
      setValues({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save entry");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {def.sections.map((section) => (
        <div key={section.title} className="rounded-md bg-card shadow-panel">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              {section.title}
            </h2>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {section.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {field.label}
                  {field.required && <span className="ml-0.5 text-destructive">*</span>}
                </Label>
                <FormFieldControl
                  field={field}
                  value={values[field.key] ?? ""}
                  onChange={onChange}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

        <div className="flex gap-2">
        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit
        </Button>
        <Button type="button" variant="outline" onClick={() => setValues({})}>
          Reset
        </Button>
      </div>
    </form>
  );
}

const FAMILY_SLUGS: Record<string, { title: string; description: string; slugs: string[] }> = {
  "boulder-reports": {
    title: "Boulder Reports",
    description: "Boulder operations — entries, diesel, and related reports.",
    slugs: ["all-boulders-entries", "boulders-diesel-entries"],
  },
  "excavator-reports": {
    title: "Excavator Reports",
    description: "Excavator operations — machines, rent, daily, and diesel reports.",
    slugs: ["machines", "excavators-entries", "excavators-daily-entries", "excavators-rent-entries", "excavators-diesel-entries"],
  },
};

function FamilyLandingPage({ slug }: { slug: string }) {
  const family = FAMILY_SLUGS[slug];
  const { data: counts } = useReportCounts();

  if (!family) {
    return (
      <AppShell>
        <div className="rounded-md bg-card px-5 py-24 text-center shadow-panel">
          <p className="text-sm text-muted-foreground">Page not found</p>
        </div>
      </AppShell>
    );
  }

  const countMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of counts ?? []) m.set(c.slug, c.count);
    return m;
  }, [counts]);

  const reports = family.slugs
    .map((s) => ({ def: findReport(s), count: countMap.get(s) ?? 0 }))
    .filter((r) => r.def);

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="rounded-md bg-card px-5 py-4 shadow-panel">
          <h1 className="text-2xl font-semibold text-foreground">{family.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{family.description}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <Link
              key={r.def!.slug}
              to="/p/$"
              params={{ _splat: r.def!.slug }}
              className="group rounded-md bg-card p-5 shadow-panel transition-colors hover:bg-sidebar-accent"
            >
              <h2 className="text-base font-semibold text-foreground">{r.def!.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {r.count.toLocaleString("en-IN")} records
              </p>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function PageView() {
  const qc = useQueryClient();
  const { _splat } = Route.useParams();
  const slug = String(_splat ?? "");
  const isTransporters = slug === "transporters";

  async function toggleTransporter(row: ReportRow, active: boolean) {
    const name = String(row["transporter_name"] ?? "transporter");
    try {
      const { error } = await supabase
        .from("transporters" as never)
        .update({ is_active: active } as never)
        .eq("id", String(row["id"]));
      if (error) throw error;
      toast.success(`${name} ${active ? "activated" : "deactivated"}`);
      qc.invalidateQueries({ queryKey: ["report", "transporters"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }
  const page = findPage(slug);
  const def = findReport(slug);
  const formDef = ENTRY_FORM_BY_SLUG.get(slug);
  const { data, isLoading, error } = useReportRows(def);
  const [query, setQuery] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [fieldQuery, setFieldQuery] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const sourceSearch = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const reportFrom = sourceSearch.get("from") ?? "";
  const reportTo = sourceSearch.get("to") ?? "";
  const specificTransporter = sourceSearch.get("transporter")?.trim().toLowerCase() ?? "";

  const activeColumns = useMemo(() => {
    if (!def || visibleColumns.length === 0) return def?.columns ?? [];
    return def.columns.filter((column) => visibleColumns.includes(column.key));
  }, [def, visibleColumns]);

  const filtered = useMemo(() => {
    const rows = (data ?? []).filter((row) => {
      const date = reportDate(row.entry_date ?? row.date_time ?? row.added_time);
      const insidePeriod = (!reportFrom || date >= reportFrom) && (!reportTo || date <= reportTo);
      const transporter = String(row.transporters ?? row.business_transporters ?? "").toLowerCase();
      const transporterMatches = !specificTransporter || transporter.includes(specificTransporter);
      return insidePeriod && transporterMatches && matches(row, query) && Object.entries(fieldQuery).every(([key, value]) =>
        !value || String(row[key] ?? "").toLowerCase().includes(value.toLowerCase()),
      );
    });
    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sort.key] ?? "";
      const bv = b[sort.key] ?? "";
      const numeric = Number(av) - Number(bv);
      const result = Number.isFinite(numeric) && String(av).trim() && String(bv).trim()
        ? numeric : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.direction === "asc" ? result : -result;
    });
  }, [data, fieldQuery, query, reportFrom, reportTo, sort, specificTransporter]);

  const summary = useMemo(() => Object.fromEntries(def?.columns.filter((column) => column.numeric).map((column) => [
    column.key,
    filtered.reduce((total, row) => total + (Number(row[column.key]) || 0), 0),
  ]) ?? []), [def, filtered]);

  function toggleSort(key: string) {
    setSort((current) => current?.key === key
      ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
      : { key, direction: "asc" });
  }

  function toggleColumn(key: string, enabled: boolean) {
    const all = def?.columns.map((column) => column.key) ?? [];
    const current = visibleColumns.length === 0 ? all : visibleColumns;
    const next = enabled ? [...current, key] : current.filter((column) => column !== key);
    setVisibleColumns(next.length === all.length ? [] : next);
  }

  const saveChanges = useMutation({
    mutationFn: async () => {
      if (!def) return;
      await Promise.all(Object.entries(drafts).map(async ([id, changes]) => {
        const payload: Record<string, string | number> = {};
        for (const [key, value] of Object.entries(changes)) {
          const column = def.columns.find((item) => item.key === key);
          payload[key] = column?.numeric ? (Number(value) || 0) : value;
        }
        const { error: updateError } = await supabase.from(def.table as never).update(payload as never).eq("id", id);
        if (updateError) throw updateError;
      }));
    },
    onSuccess: () => { setDrafts({}); qc.invalidateQueries({ queryKey: ["report", def?.slug] }); toast.success("Changes saved"); },
    onError: (saveError) => toast.error(saveError instanceof Error ? saveError.message : "Could not save changes"),
  });

  function setDraft(id: string, key: string, value: string) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], [key]: value } }));
  }

  if (formDef) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="rounded-md bg-card px-5 py-4 shadow-panel">
            <h1 className="text-base font-semibold text-foreground">{formDef.title}</h1>
            <p className="text-xs text-muted-foreground">
              {page?.parent ?? ""} &nbsp;›&nbsp; {formDef.title}
            </p>
          </div>
          <EntryFormView def={formDef} />
        </div>
      </AppShell>
    );
  }

  // Family landing pages (Boulder Reports / Excavator Reports)
  if (slug === "boulder-reports" || slug === "excavator-reports") {
    return <FamilyLandingPage slug={slug} />;
  }

  if (!def) {
    return (
      <AppShell>
        <div className="rounded-md bg-card shadow-panel">
          <div className="px-5 py-24 text-center">
            <p className="text-sm font-medium text-foreground">Page not found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The page you're looking for couldn't be found or doesn't exist.
            </p>
            <Link to="/" className="mt-4 inline-block text-sm font-medium text-action hover:underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="rounded-md bg-card shadow-panel">
        {/* Report header — mirrors Zoho's report header (name + search/filter/export/print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div>
            <h1 className="text-base font-semibold text-foreground">{def.label}</h1>
            <p className="text-xs text-muted-foreground">
              {page?.parent ?? ""} &nbsp;›&nbsp; {def.label} &nbsp;·&nbsp;{" "}
              {filtered.length} records
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9" disabled={!Object.keys(drafts).length || saveChanges.isPending} onClick={() => saveChanges.mutate()}>
              Save Changes
            </Button>
            <Button variant="outline" size="sm" className="h-9" disabled={!Object.keys(drafts).length} onClick={() => setDrafts({})}>
              Remove Changes
            </Button>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 w-52 pl-8"
              />
            </div>
            <Button variant={advancedOpen ? "secondary" : "outline"} size="sm" className="h-9" onClick={() => setAdvancedOpen((open) => !open)}>
              <SlidersHorizontal className="mr-1.5 h-4 w-4" /> Advanced Search
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9"><Columns3 className="mr-1.5 h-4 w-4" /> Columns</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-80 w-60 overflow-y-auto">
                <DropdownMenuLabel>Show / Hide Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {def.columns.map((column) => {
                  const checked = visibleColumns.length === 0 || visibleColumns.includes(column.key);
                  return <DropdownMenuCheckboxItem key={column.key} checked={checked} onCheckedChange={(value) => toggleColumn(column.key, value)}>{column.label}</DropdownMenuCheckboxItem>;
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">More Options</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</DropdownMenuItem>
                <DropdownMenuItem disabled={filtered.length === 0} onClick={() => exportRowsCsv(def, filtered)}><Download className="mr-2 h-4 w-4" />Export CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {REPORT_TO_FORM[def.slug] && (
              <Link
                to="/p/$"
                params={{ _splat: REPORT_TO_FORM[def.slug]! }}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-action px-3 text-sm font-medium text-action-foreground hover:bg-action/90"
              >
                <Plus className="h-4 w-4" /> Add
              </Link>
            )}
          </div>
        </div>
        {advancedOpen && (
          <div className="grid gap-3 border-b border-border bg-muted/25 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
            {def.columns.slice(0, 8).map((column) => (
              <div key={column.key} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{column.label}</Label>
                <Input value={fieldQuery[column.key] ?? ""} onChange={(event) => setFieldQuery((current) => ({ ...current, [column.key]: event.target.value }))} placeholder={`Filter ${column.label}`} className="h-8" />
              </div>
            ))}
            <div className="flex items-end"><Button variant="ghost" size="sm" onClick={() => setFieldQuery({})}>Clear filters</Button></div>
          </div>
        )}

        {/* Spreadsheet-style grid */}
        <div className="overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                {activeColumns.map((c) => (
                  <th
                    key={c.key}
                    className="whitespace-nowrap border-b border-border px-4 py-2.5 font-semibold"
                  >
                    <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-foreground">
                      {c.label}<ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={activeColumns.length}>
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={activeColumns.length}
                    className="px-4 py-16 text-center text-muted-foreground"
                  >
                    Failed to load records.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeColumns.length}
                    className="px-4 py-16 text-center text-muted-foreground"
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => {
                  const rowId = String(row.id ?? i);
                  return <tr key={rowId} className="border-b border-border hover:bg-muted/30">
                    {activeColumns.map((c) => (
                      <td
                        key={c.key}
                        className={`whitespace-nowrap border-b border-border px-4 py-2 ${
                          c.numeric ? "text-right tabular-nums" : "text-foreground"
                        }`}
                      >
                        <Input
                          aria-label={`${c.label} row ${i + 1}`}
                          type={c.numeric ? "number" : "text"}
                          value={drafts[rowId]?.[c.key] ?? String(row[c.key] ?? "")}
                          onChange={(event) => setDraft(rowId, c.key, event.target.value)}
                          className={`h-8 min-w-24 border-transparent bg-transparent px-1 shadow-none hover:border-border focus-visible:border-ring ${c.numeric ? "text-right tabular-nums" : ""}`}
                        />
                      </td>
                    ))}
                    {isTransporters && (
                      <td className="whitespace-nowrap border-b border-border px-4 py-2">
                        {row["is_active"] === true || row["is_active"] === "true" ? (
                          <Button size="sm" variant="outline" onClick={() => toggleTransporter(row, false)}>
                            <PowerOff className="mr-1.5 h-3.5 w-3.5" /> Make Inactive
                          </Button>
                        ) : (
                          <Button size="sm" className="bg-action text-action-foreground hover:bg-action/90" onClick={() => toggleTransporter(row, true)}>
                            <Power className="mr-1.5 h-3.5 w-3.5" /> Make Active
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>;
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-5 py-3">
          <Button variant="ghost" size="sm" onClick={() => setShowSummary((show) => !show)}>
            {showSummary ? "Hide Summary" : "Show Summary"}
          </Button>
          {showSummary && (
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 rounded-md bg-muted/40 px-4 py-3 text-sm">
              {activeColumns.filter((column) => column.numeric).map((column) => (
                <p key={column.key} className="whitespace-nowrap"><span className="text-muted-foreground">{column.label}: </span><span className="font-semibold tabular-nums">{formatCell(summary[column.key], true)}</span></p>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
