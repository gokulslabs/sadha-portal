import { createFileRoute, Link } from "@tanstack/react-router";
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

function QuickAction({ label, slug }: { label: string; slug: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-md bg-card px-5 py-6 shadow-panel">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-action/10">
        <Plus className="h-4 w-4 text-action" />
      </span>
      <Link
        to="/p/$"
        params={{ _splat: slug }}
        className="rounded-md bg-action px-4 py-2 text-sm font-medium text-action-foreground transition-colors hover:bg-action/90"
      >
        {label}
      </Link>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "action",
  sub,
  icon = "wallet",
}: {
  label: string;
  value: string;
  tone?: "action" | "danger" | "success";
  sub?: string;
  icon?: "wallet" | "in" | "out";
}) {
  const toneClass =
    tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-action";
  const Icon = icon === "out" ? TrendingDown : icon === "in" ? TrendingUp : Wallet;
  return (
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
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-card px-4 py-5 shadow-panel transition-shadow duration-200 hover:shadow-lift">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-sm">₹</span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-lg font-semibold ${tone ?? "text-action"}`}>{value}</p>
      </div>
    </div>
  );
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

function Dashboard() {
  const { data, isLoading } = useDashboardData();

  const transporters = data?.transporters ?? [];
  const financeByType = data?.finance.byType ?? [];

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
            <StatCard label="Total Client Balance" value={inr(data?.totalClientBalance ?? 0)} />
            <StatCard label="Vendor Balance" value={inr(data?.vendorBalance ?? 0)} tone="danger" icon="out" />
            <StatCard label="Total Diesel Balance" value={inr(data?.totalDieselBalance ?? 0)} />
            <StatCard label="Driver Balance" value={inr(data?.driverBalance ?? 0)} tone="danger" icon="out" />
          </div>
        </div>
        <div>
          <SectionBar title="Quick Actions" icon="action" />
          <div className="grid gap-4 sm:grid-cols-2">
            <QuickAction label="Add Client Income" slug="add-sales-entry" />
            <QuickAction label="Add Vendor Expense" slug="income-expense" />
            <QuickAction label="Add Diesel Amount" slug="add-rent-entry" />
            <QuickAction label="Add Driver Expense" slug="add-day-fees-entry" />
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
                <MiniStat key={t.name} label={t.name} value={inr(t.value)} />
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
            {financeByType.map((f) => (
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
                <BarChart data={financeByType}>
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
            <MiniStat label="Today Sales" value={inr(data?.today.sales ?? 0)} />
            <MiniStat label="Purchase" value={inr(data?.today.purchase ?? 0)} tone="text-danger" />
            <MiniStat label="Sales" value={inr(data?.today.salesIncome ?? 0)} tone="text-success" />
            <MiniStat label="Diesel" value={inr(data?.today.diesel ?? 0)} tone="text-danger" />
            <MiniStat label="Driver" value={inr(data?.today.driver ?? 0)} tone="text-danger" />
            <MiniStat label="Profit" value={inr(data?.today.profit ?? 0)} tone="text-success" />
          </div>
        </div>
      </div>

      {/* Today Rent Performance */}
      <div className="mt-5">
        <SectionBar title="Today Rent Performance" icon="chart" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <MiniStat label="Today Rent" value={inr(data?.today.rent ?? 0)} tone="text-success" />
            <MiniStat label="Diesel - OWN" value={inr(data?.today.rentDieselOwn ?? 0)} tone="text-danger" />
            <MiniStat label="Driver" value={inr(data?.today.rentDriver ?? 0)} tone="text-danger" />
            <MiniStat label="Rent" value={inr(data?.today.rent ?? 0)} tone="text-success" />
            <MiniStat label="Diesel - RENT" value={inr(data?.today.rentDieselRent ?? 0)} tone="text-danger" />
            <MiniStat label="Profit" value={inr(data?.today.rentProfit ?? 0)} tone="text-success" />
          </div>
        </div>
      </div>

      {/* Today Direct Diesel Performance */}
      <div className="mt-5">
        <SectionBar title="Today Direct Diesel Performance" icon="chart" />
        <div className="grid gap-4 sm:grid-cols-2">
          <MiniStat label="Diesel - RENT" value={inr(data?.today.directDieselRent ?? 0)} tone="text-danger" />
          <MiniStat label="Diesel - OWN" value={inr(data?.today.directDieselOwn ?? 0)} tone="text-danger" />
        </div>
      </div>

      {/* Today Excavators Performance */}
      <div className="mt-5">
        <SectionBar title="Today Excavators Performance" icon="chart" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat label="Loads" value={Number(data?.today.excavatorLoads ?? 0).toFixed(2)} />
          <MiniStat label="Tons" value={Number(data?.today.excavatorTons ?? 0).toFixed(2)} />
          <MiniStat label="Amount With GST" value={inr(data?.today.excavatorAmount ?? 0)} tone="text-success" />
          <MiniStat label="Profit" value={inr(0)} tone="text-success" />
        </div>
      </div>

      {/* Master counts */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-8">
        {[
          [String(data?.counts.clients ?? 0), "Total Clients", "clients"],
          [String(data?.counts.materials ?? 0), "Total Materials", "materials"],
          [String(data?.counts.drivers ?? 0), "Total Drivers", "drivers"],
          [String(data?.counts.vehicles ?? 0), "Total Vehicles", "vehicles"],
          [String(data?.counts.machines ?? 0), "Total Machines", "machines"],
          [String(data?.counts.vendors ?? 0), "Total Vendors", "vendors"],
          [String(data?.counts.transporters ?? 0), "Transporters", "transporters"],
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
    </AppShell>
  );
}