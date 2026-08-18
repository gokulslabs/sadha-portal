import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Download, Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
  const { _splat } = Route.useParams();
  const slug = String(_splat ?? "");
  const page = findPage(slug);
  const def = findReport(slug);
  const formDef = ENTRY_FORM_BY_SLUG.get(slug);
  const { data, isLoading, error } = useReportRows(def);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => (data ?? []).filter((row) => matches(row, query)),
    [data, query],
  );

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
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 w-52 pl-8"
              />
            </div>
            <Button variant="outline" size="sm" className="h-9" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => exportRowsCsv(def, filtered)}
              disabled={filtered.length === 0}
            >
              <Download className="h-4 w-4" />
            </Button>
            {REPORT_TO_FORM[def.slug] ? (
              <Link
                to="/p/$"
                params={{ _splat: REPORT_TO_FORM[def.slug]! }}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-action px-3 text-sm font-medium text-action-foreground hover:bg-action/90"
              >
                <Plus className="h-4 w-4" /> Add
              </Link>
            ) : (
              <Button size="sm" className="h-9 bg-action text-action-foreground hover:bg-action/90" disabled>
                <Plus className="h-4 w-4" /> Add
              </Button>
            )}
          </div>
        </div>

        {/* Spreadsheet-style grid */}
        <div className="overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                {def.columns.map((c) => (
                  <th
                    key={c.key}
                    className="whitespace-nowrap border-b border-border px-4 py-2.5 font-semibold"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={def.columns.length}>
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={def.columns.length}
                    className="px-4 py-16 text-center text-muted-foreground"
                  >
                    Failed to load records.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={def.columns.length}
                    className="px-4 py-16 text-center text-muted-foreground"
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/30">
                    {def.columns.map((c) => (
                      <td
                        key={c.key}
                        className={`whitespace-nowrap border-b border-border px-4 py-2 ${
                          c.numeric ? "text-right tabular-nums" : "text-foreground"
                        }`}
                      >
                        {formatCell(row[c.key], c.numeric)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}