import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart3,
  Plus,
  Wallet,
  Filter,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/")({
  head: () => {
    const title = "Dashboard | Sadha Groups Portal";
    const description =
      "Sadha Groups operations dashboard: client, vendor, driver and diesel balances with sales, rent, boulders and excavator performance.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: Dashboard,
});

const inr = (n: number) =>
  "₹ " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const inr0 = (n: number) => "₹ " + n.toLocaleString("en-US", { maximumFractionDigits: 0 });

const todayLabel = () => {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("day")}-${part("month")}-${part("year")}`;
};

function SectionBar({ title, icon }: { title: string; icon: "chart" | "action" }) {
  return (
    <div className="mb-3 flex items-center justify-center gap-2 rounded-md bg-card py-3.5 shadow-panel">
      {icon === "chart" ? (
        <BarChart3 className="h-5 w-5 text-action" />
      ) : (
        <Plus className="h-5 w-5 text-action" />
      )}
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
  );
}

type QuickActionKind = "client" | "diesel" | "vendor" | "driver";

const QUICK_ACTIONS: { label: string; kind: QuickActionKind }[] = [
  { label: "Add Client Income", kind: "client" },
  { label: "Add Diesel Amount", kind: "diesel" },
  { label: "Add Vendor Expense", kind: "vendor" },
  { label: "Add Driver Expense", kind: "driver" },
];

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-md bg-card px-5 py-6 shadow-panel">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-action/10">
        <Plus className="h-4 w-4 text-action" />
      </span>
      <button
        type="button"
        onClick={onClick}
        className="rounded-md bg-action px-4 py-2 text-sm font-medium text-action-foreground transition-colors hover:bg-action/90"
      >
        {label}
      </button>
    </div>
  );
}

function IncomeExpenseDialog({
  kind,
  onClose,
}: {
  kind: QuickActionKind | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const preset = kind === "client" ? { type: "Income", payment_for: "Client Payment" }
    : kind === "diesel" ? { type: "Expense", payment_for: "Diesel Payment" }
    : kind === "vendor" ? { type: "Expense", payment_for: "Vendor Payment" }
    : { type: "Expense", payment_for: "Driver Payment" };
  const save = useMutation({
    mutationFn: async () => {
      const numeric = (key: string) => Number(values[key] || 0) || 0;
      const text = (key: string) => values[key]?.trim() || null;
      const { error } = await supabase.from("income_expense_entries" as never).insert({
        payment_id: text("payment_id"), type: preset.type, date_time: text("date_time"),
        business_transporters: text("business_transporters"), account: text("account"),
        payment_for: text("payment_for") ?? preset.payment_for, category: text("category"),
        sales_entry_id: text("sales_entry_id"), rent_entry_id: text("rent_entry_id"),
        day_fees_entry_id: text("day_fees_entry_id"), boulder_entry_id: text("boulder_entry_id"),
        dc_number: text("dc_number"), vendor: text("vendor"), client: text("client"),
        driver: text("driver"), vehicle: text("vehicle"), income: preset.type === "Income" ? numeric("income") : 0,
        expense: preset.type === "Expense" ? numeric("expense") : 0, remarks: text("remarks"),
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard"] }); qc.invalidateQueries({ queryKey: ["report"] }); toast.success("Income & expense entry saved"); setValues({}); onClose(); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save entry"),
  });
  const set = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const fields = [
    ["payment_id", "Payment ID"], ["business_transporters", "Business Transporters"], ["date_time", "Date-Time", "datetime-local"],
    ["payment_for", "Payment For"], ["category", "Category"], ["sales_entry_id", "Sales Entry ID"], ["rent_entry_id", "Rent Entry ID"],
    ["day_fees_entry_id", "Day Fees Entry ID"], ["boulder_entry_id", "Boulder Entry ID"], ["dc_number", "DC Number"],
    ["vendor", "Vendor"], ["client", "Client"], ["driver", "Driver"], ["vehicle", "Vehicle"], ["account", "Choose Account"],
  ] as const;
  return (
    <Dialog open={kind !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader><DialogTitle>Income &amp; Expense</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map(([key, label, type]) => <div key={key} className="space-y-1.5"><Label>{label}{["business_transporters", "payment_for", "category", "account"].includes(key) && <span className="text-destructive">*</span>}</Label><Input type={type ?? "text"} value={values[key] ?? (key === "payment_for" ? preset.payment_for : "")} onChange={(event) => set(key, event.target.value)} /></div>)}
            <div className="space-y-1.5"><Label>Type*</Label><Input value={preset.type} readOnly /></div>
            <div className="space-y-1.5"><Label>Income Amount</Label><Input type="number" step="0.01" disabled={preset.type !== "Income"} value={values.income ?? ""} onChange={(event) => set("income", event.target.value)} /></div>
            <div className="space-y-1.5"><Label>Expense Amount</Label><Input type="number" step="0.01" disabled={preset.type !== "Expense"} value={values.expense ?? ""} onChange={(event) => set("expense", event.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Remarks</Label><Textarea value={values.remarks ?? ""} onChange={(event) => set("remarks", event.target.value)} placeholder="Add your Note here ..." /></div>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Submit"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  label,
  value,
  tone = "action",
  sub,
  icon = "wallet",
  slug,
}: {
  label: string;
  value: string;
  tone?: "action" | "danger" | "success";
  sub?: string;
  icon?: "wallet" | "in" | "out";
  slug?: string;
}) {
  const toneClass =
    tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-action";
  const Icon = icon === "out" ? TrendingDown : icon === "in" ? TrendingUp : Wallet;
  const content = (
    <div className="flex items-center gap-4 rounded-md bg-card px-5 py-6 shadow-panel transition-shadow duration-200 hover:shadow-lift">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className={`h-5 w-5 ${toneClass}`} />
      </span>
      <div className="min-w-0">
        <p className={`text-xl font-semibold tracking-tight ${toneClass}`}>{value}</p>
        <p className="text-sm text-muted-foreground">
          {label}
          {sub && <span className="ml-1 italic text-muted-foreground/80">{sub}</span>}
        </p>
      </div>
    </div>
  );
  if (!slug) return content;
  return <Link to="/p/$" params={{ _splat: slug }} className="block">{content}</Link>;
}

function MiniStat({ label, value, tone, slug }: { label: string; value: string; tone?: string; slug?: string }) {
  const content = (
    <div className="flex items-center gap-3 rounded-md bg-card px-4 py-5 shadow-panel transition-shadow duration-200 hover:shadow-lift">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-sm">₹</span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-lg font-semibold ${tone ?? "text-action"}`}>{value}</p>
      </div>
    </div>
  );
  return slug ? <Link to="/p/$" params={{ _splat: slug }} className="block">{content}</Link> : content;
}

const PIE_COLORS = ["var(--chart-red)", "var(--chart-amber)", "var(--chart-blue)", "var(--chart-green)", "var(--chart-5)"];

/** Zoho-style donut: slices with colored ring, center total, right-side legend. */
function TransporterDonut({
  data,
  total,
}: {
  data: { name: string; value: number }[];
  total: number;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
        No transporter data
      </div>
    );
  }
  const pct = (v: number) => (total > 0 ? `${((v / total) * 100).toFixed(1)}%` : "0%");
  return (
    <div className="flex h-[400px] items-center gap-4">
      <div className="relative h-[280px] w-[280px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={88}
              outerRadius={126}
              paddingAngle={1}
              strokeWidth={2}
              stroke="var(--card)"
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => [inr(Number(v)), "Balance"]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xl font-bold text-foreground">{inr0(total)}</p>
          <p className="text-xs text-muted-foreground">Total Balance</p>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {data.map((entry, i) => (
          <div key={entry.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-foreground">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {inr0(entry.value)} · {pct(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerformanceChart({
  values,
  labels,
}: {
  values: { key: string; value: number }[];
  labels: string[];
}) {
  const chartData = values.map(({ key, value }) => ({ name: key, value }));
  return (
    <div className="rounded-md bg-card p-4 shadow-panel">
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 18, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} width={70} />
            <Tooltip formatter={(value: number) => inr(Number(value))} />
            <Bar dataKey="value" fill="var(--chart-green)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-xs text-muted-foreground">{labels.join(" · ")}</p>
    </div>
  );
}

function Dashboard() {
  const { data, isLoading } = useDashboardData();
  const [quickAction, setQuickAction] = useState<QuickActionKind | null>(null);

  const transporters = data?.transporters ?? [];
  const financeByType = data?.finance.byType ?? [];
  const financeChart = [...financeByType]
    .filter((item) => item.name !== "Diesel Payment")
    .sort((a, b) => ["Vendor Payment", "Client Payment", "Driver Payment", "Own"].indexOf(a.name) - ["Vendor Payment", "Client Payment", "Driver Payment", "Own"].indexOf(b.name));

  const pieData = transporters.length
    ? transporters
    : [{ name: "No data", value: 0 }];

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Balance Overview + Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <SectionBar title="Balance Overview" icon="chart" />
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Total Client Balance" value={inr(data?.totalClientBalance ?? 0)} slug="clients" />
            <StatCard label="Total Diesel Balance" value={inr(data?.totalDieselBalance ?? 0)} slug="diesel-entries" />
            <StatCard label="Vendor Balance" value={inr(data?.vendorBalance ?? 0)} tone="danger" icon="out" slug="vendors" />
            <StatCard label="Driver Balance" value={inr(data?.driverBalance ?? 0)} tone="danger" icon="out" slug="drivers" />
          </div>
        </div>
        <div>
          <SectionBar title="Quick Actions" icon="action" />
          <div className="grid gap-4 sm:grid-cols-2">
            {QUICK_ACTIONS.map((action) => <QuickAction key={action.kind} label={action.label} onClick={() => setQuickAction(action.kind)} />)}
          </div>
        </div>
      </div>

      {/* Transporter Wise */}
      <div className="mt-5">
        <SectionBar title="Transporter Wise Accounts Overview" icon="chart" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-md bg-card p-4 shadow-panel">
            <TransporterDonut data={transporters} total={data?.transporterTotal ?? 0} />
          </div>
          <div className="grid content-start gap-4">
            <MiniStat label="Overall Current Balance" value={inr(data?.transporterTotal ?? 0)} />
            <div className="grid gap-4 sm:grid-cols-2">
              {transporters.slice(0, 4).map((t) => (
                <MiniStat key={t.name} label={t.name} value={inr(t.value)} slug="transporters" />
              ))}
              {transporters.length === 0 && (
                <MiniStat label="No transporter data" value="—" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="mt-5">
        <SectionBar title="Financial Overview" icon="chart" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Overall Income" value={inr(data?.finance.income ?? 0)} tone="success" icon="in" />
            <StatCard label="Overall Expense" value={inr(data?.finance.expense ?? 0)} tone="danger" icon="out" />
            {financeByType.filter((f) => f.name !== "Own").map((f) => (
              <StatCard
                key={f.name}
                label={f.name}
                sub={f.income > f.expense ? "(Inc)" : "(Exp)"}
                value={inr(f.income || f.expense)}
                icon={f.income > f.expense ? "in" : "out"}
              />
            ))}
          </div>
          <div className="relative rounded-md bg-card p-4 shadow-panel">
            <button className="absolute right-4 top-4 rounded-md border border-danger/30 bg-danger/5 p-2">
              <Filter className="h-4 w-4 text-danger" />
            </button>
            <div className="h-[360px] pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeChart.map((item) => ({ ...item, name: item.name.replace(/ Payment$/, "") }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={70} />
                  <Tooltip formatter={(v: number) => inr(Number(v))} />
                  <Legend verticalAlign="top" iconType="square" />
                  <Bar dataKey="expense" name="Expense Amount" fill="var(--chart-blue)" />
                  <Bar dataKey="income" name="Income Amount" fill="var(--chart-green)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Today Sales Performance */}
      <div className="mt-5">
        <SectionBar title="Today Sales Performance" icon="chart" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <MiniStat label="Today Sales" value={String(data?.today.salesCount ?? 0)} slug="sales-entries" />
            <MiniStat label="Purchase" value={inr(data?.today.purchase ?? 0)} tone="text-danger" slug="sales-entries" />
            <MiniStat label="Sales" value={inr(data?.today.salesIncome ?? 0)} tone="text-success" slug="sales-entries" />
            <MiniStat label="Diesel" value={inr(data?.today.diesel ?? 0)} tone="text-danger" slug="diesel-entries" />
            <MiniStat label="Driver" value={inr(data?.today.driver ?? 0)} tone="text-danger" slug="drivers" />
            <MiniStat label="Profit" value={inr(data?.today.profit ?? 0)} tone="text-success" />
          </div>
          <PerformanceChart
            values={[
              { key: "Sales", value: data?.today.salesIncome ?? 0 },
              { key: "Purchase", value: data?.today.purchase ?? 0 },
              { key: "Driver", value: data?.today.driver ?? 0 },
              { key: "Diesel", value: data?.today.diesel ?? 0 },
              { key: "Profit", value: data?.today.profit ?? 0 },
            ]}
            labels={[todayLabel(), "Sales Net Total", "Purchase Net Total", "Driver Net Total", "Diesel Amount", "Profit"]}
          />
        </div>
      </div>

      {/* Today Rent Performance */}
      <div className="mt-5">
        <SectionBar title="Today Rent Performance" icon="chart" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <MiniStat label="Today Rent" value={String(data?.today.rentCount ?? 0)} tone="text-success" slug="rent-entries" />
            <MiniStat label="Diesel - OWN" value={inr(data?.today.rentDieselOwn ?? 0)} tone="text-danger" slug="rent-entries" />
            <MiniStat label="Driver" value={inr(data?.today.rentDriver ?? 0)} tone="text-danger" slug="drivers" />
            <MiniStat label="Rent" value={inr(data?.today.rent ?? 0)} tone="text-success" slug="rent-entries" />
            <MiniStat label="Diesel - RENT" value={inr(data?.today.rentDieselRent ?? 0)} tone="text-danger" slug="rent-entries" />
            <MiniStat label="Profit" value={inr(data?.today.rentProfit ?? 0)} tone="text-success" />
          </div>
          <PerformanceChart
            values={[
              { key: "Rent", value: data?.today.rent ?? 0 },
              { key: "Driver", value: data?.today.rentDriver ?? 0 },
              { key: "Diesel", value: data?.today.rentDieselRent ?? 0 },
              { key: "Profit", value: data?.today.rentProfit ?? 0 },
            ]}
            labels={[todayLabel(), "Rent Amount with GST", "Driver Net Total", "Diesel Amount", "Profit"]}
          />
        </div>
      </div>

      {/* Today Direct Diesel Performance */}
      <div className="mt-5">
        <SectionBar title="Today Direct Diesel Performance" icon="chart" />
        <div className="grid gap-4 sm:grid-cols-2">
          <MiniStat label="Diesel - RENT" value={inr(data?.today.directDieselRent ?? 0)} tone="text-danger" slug="diesel-entries" />
          <MiniStat label="Diesel - OWN" value={inr(data?.today.directDieselOwn ?? 0)} tone="text-danger" slug="diesel-entries" />
        </div>
      </div>

      {/* Today Excavators Performance */}
      <div className="mt-5">
        <SectionBar title="Today Excavators Performance" icon="chart" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MiniStat label="Loads" value={Number(data?.today.excavatorLoads ?? 0).toFixed(2)} slug="excavators-daily-entries" />
          <MiniStat label="Tons Per Rate" value={Number(data?.today.excavatorTonRate ?? 0).toFixed(2)} slug="excavators-daily-entries" />
          <MiniStat label="Diesel Amount" value={inr(data?.today.excavatorDiesel ?? 0)} tone="text-danger" slug="excavators-daily-entries" />
          <MiniStat label="Tons" value={Number(data?.today.excavatorTons ?? 0).toFixed(2)} slug="excavators-daily-entries" />
          <MiniStat label="Amount With GST" value={inr(data?.today.excavatorAmount ?? 0)} tone="text-success" slug="excavators-daily-entries" />
          <MiniStat label="Profit" value={inr(data?.today.excavatorProfit ?? 0)} tone="text-success" slug="excavators-daily-entries" />
        </div>
      </div>

      {/* Master counts */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {[
          [String(data?.counts.clients ?? 0), "Total Clients", "clients"],
          [String(data?.counts.materials ?? 0), "Total Materials", "materials"],
          [String(data?.counts.drivers ?? 0), "Total Drivers", "drivers"],
          [String(data?.counts.vehicles ?? 0), "Total Vehicles", "vehicles"],
          [String(data?.counts.machines ?? 0), "Total Machines", "machines"],
          [String(data?.counts.vendors ?? 0), "Total Vendors", "vendors"],
          [String(data?.counts.tyres ?? 0), "Tyres", "tyre"],
        ].map(([n, label, slug]) => {
          const s = slug as string;
          return (
            <Link
              key={label}
              to={s === "tyre" ? "/tyre" : "/p/$"}
              params={s === "tyre" ? {} : { _splat: s }}
              className="flex flex-col items-center rounded-md bg-card px-3 py-6 shadow-panel transition-colors hover:bg-sidebar-accent"
            >
              <p className="text-2xl font-semibold text-action">{n}</p>
              <p className="mt-1 text-center text-sm text-muted-foreground">{label}</p>
            </Link>
          );
        })}
      </div>
      <IncomeExpenseDialog kind={quickAction} onClose={() => setQuickAction(null)} />
    </AppShell>
  );
}
