import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { NAV } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/all-reports")({
  head: () => ({ title: "Search Report | Sadha Groups Portal" }),
  component: AllReports,
});

const SOURCE_REPORTS = NAV
  .filter((section) => section.label !== "Dashboard" && section.label !== "Tyres")
  .flatMap((section) => (section.children ?? [])
    .filter((child) => !child.label.startsWith("Add "))
    .map((child) => ({ ...child, section: section.label })));

function AllReports() {
  const navigate = useNavigate();
  const [btType, setBtType] = useState<"All" | "Specific">("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState("");
  const [transporter, setTransporter] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!report) return;
    void navigate({ to: "/p/$", params: { _splat: report }, search: { from, to, btType, transporter } as never });
  }

  return <AppShell><div className="mx-auto max-w-3xl pt-8"><div className="rounded-md bg-card shadow-panel">
    <div className="border-b border-border px-6 py-4"><h1 className="text-lg font-semibold text-foreground">Search Report</h1></div>
    <form className="space-y-6 p-6" onSubmit={submit}>
      <fieldset className="space-y-2"><legend className="text-sm font-medium text-foreground">BT Type</legend><div className="flex gap-6">
        {(["All", "Specific"] as const).map((value) => <label key={value} className="flex items-center gap-2 text-sm"><input type="radio" checked={btType === value} onChange={() => setBtType(value)} />{value}</label>)}
      </div></fieldset>
      {btType === "Specific" && <div className="space-y-1.5"><Label htmlFor="specific-transporter">Business Transporter<span className="text-destructive">*</span></Label><Input id="specific-transporter" value={transporter} onChange={(event) => setTransporter(event.target.value)} required placeholder="Enter transporter name" /></div>}
      <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="report-from">Report From<span className="text-destructive">*</span></Label><Input id="report-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} required /></div><div className="space-y-1.5"><Label htmlFor="report-to">Report To<span className="text-destructive">*</span></Label><Input id="report-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} required /></div></div>
      <div className="space-y-1.5"><Label htmlFor="report-for">Report For<span className="text-destructive">*</span></Label><select id="report-for" value={report} onChange={(event) => setReport(event.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"><option value="">-Select-</option>{SOURCE_REPORTS.map((item) => <option key={item.slug} value={item.slug}>{item.section} — {item.label}</option>)}</select></div>
      <Button type="submit">Submit</Button>
    </form>
  </div></div></AppShell>;
}
