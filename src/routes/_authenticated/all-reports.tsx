import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, Search, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { NAV } from "@/lib/nav";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useReportCounts } from "@/hooks/useReportData";

export const Route = createFileRoute("/_authenticated/all-reports")({
  head: () => ({
    title: "All Reports | Sadha Groups Portal",
    meta: [
      {
        name: "description",
        content: "Searchable index of all operational and financial reports for Sadha Groups.",
      },
    ],
  }),
  component: AllReports,
});

const SPECIAL_LINKS: Record<string, string> = {
  dashboard: "/",
  "all-reports": "/all-reports",
  tyre: "/tyre",
  "tyre-report": "/tyre-report",
  "tyre-module": "/tyre-module",
};

function linkFor(slug: string): { to: string; params: Record<string, string> } {
  if (slug in SPECIAL_LINKS) return { to: SPECIAL_LINKS[slug]!, params: {} };
  return { to: "/p/$", params: { _splat: slug } };
}

function AllReports() {
  const { data: counts, isLoading } = useReportCounts();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const countMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of counts ?? []) m.set(c.slug, c.count);
    return m;
  }, [counts]);

  // Flatten nav into searchable report list, retaining section grouping.
  const sections = NAV.filter((s) => s.label !== "Dashboard").map((section) => {
    const children = (section.children ?? [])
      .filter((c) => {
        if (!q) return true;
        return (
          c.label.toLowerCase().includes(q) || section.label.toLowerCase().includes(q)
        );
      })
      .map((c) => ({ ...c, parent: section.label }));
    return { label: section.label, children };
  }).filter((s) => s.children.length > 0);

  const total = counts?.reduce((s, c) => s + c.count, 0) ?? 0;

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-card px-5 py-4 shadow-panel">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">All Reports</h1>
            <p className="text-xs text-muted-foreground">
              {counts?.length ?? 0} report types · {total.toLocaleString("en-IN")} total records
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-64 pl-8"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sections.map((section) => (
              <div key={section.label} className="rounded-md bg-card shadow-panel">
                <div className="border-b border-border px-4 py-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    {section.label}
                  </h2>
                </div>
                <div className="p-2">
                  {section.children.map((report) => {
                    const link = linkFor(report.slug);
                    const count = countMap.get(report.slug) ?? 0;
                    return (
                      <Link
                        key={report.slug}
                        to={link.to}
                        params={link.params}
                        className="group flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
                          <span>{report.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs tabular-nums text-muted-foreground/70">
                            {count.toLocaleString("en-IN")}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-40" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}