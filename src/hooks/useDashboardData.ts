import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Row = Record<string, unknown>;

async function fetchRows(table: string, columns = "*"): Promise<Row[]> {
  // Supabase limits a response to 1,000 rows even when a larger `.limit()` is
  // requested. Dashboard aggregates must use every operational row.
  const pageSize = 1_000;
  const rows: Row[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table as never)
      .select(columns)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as Row[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function countRows(table: string): Promise<number> {
  const { count, error } = await supabase
    .from(table as never)
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

function sum(rows: Row[], key: string): number {
  return rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
}

// Reference entry dates use several text formats ("03-Aug-2026", "2024-03-20", "08/18/2026").
function normalizeDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const s = String(value).trim();
  const enMonth: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const m1 = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (m1) return `${m1[3]}-${enMonth[m1[2]!.toLowerCase()]}-${m1[1]!.padStart(2, "0")}`;
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return s;
  const m3 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m3) return `${m3[3]}-${m3[1]!.padStart(2, "0")}-${m3[2]!.padStart(2, "0")}`;
  // ISO datetime
  const m4 = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ]/);
  if (m4) return `${m4[1]}-${m4[2]}-${m4[3]}`;
  return null;
}

function isToday(value: unknown): boolean {
  const n = normalizeDate(value);
  if (!n) return false;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  return n === today;
}

export type DashboardData = {
  totalClientBalance: number;
  vendorBalance: number;
  totalDieselBalance: number;
  driverBalance: number;

  transporters: { name: string; value: number }[];
  transporterTotal: number;

  finance: { income: number; expense: number; byType: { name: string; income: number; expense: number }[] };

  today: {
    sales: number;
    salesCount: number;
    purchase: number;
    salesIncome: number;
    diesel: number;
    driver: number;
    profit: number;
    rent: number;
    rentCount: number;
    rentDieselOwn: number;
    rentDieselRent: number;
    rentDriver: number;
    rentProfit: number;
    directDieselRent: number;
    directDieselOwn: number;
    excavatorLoads: number;
    excavatorTons: number;
    excavatorTonRate: number;
    excavatorAmount: number;
    excavatorDiesel: number;
    excavatorProfit: number;
  };

  counts: { clients: number; materials: number; drivers: number; vehicles: number; machines: number; vendors: number; transporters: number; tyres: number };
};

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardData> => {
      const [clients, vendors, drivers, transporters, incomeExpense, sales, rent, diesel, excavatorDaily] =
        await Promise.all([
          fetchRows("clients"),
          fetchRows("vendors"),
          fetchRows("drivers"),
          fetchRows("transporters"),
          fetchRows("income_expense_entries"),
          fetchRows("sales_entries"),
          fetchRows("rent_entries"),
          fetchRows("diesel_entries"),
          fetchRows("excavator_daily_entries"),
        ]);

      const [vehicleCount, materialCount, machineCount, tyreCount, clientCount, vendorCount, driverCount, transporterCount] =
        await Promise.all([
          countRows("fleet_vehicles"),
          countRows("materials"),
          countRows("machines"),
          countRows("tyres"),
          countRows("clients"),
          countRows("vendors"),
          countRows("drivers"),
          countRows("transporters"),
        ]);

      // Transporter-wise balances (grouped)
      const tMap = new Map<string, number>();
      for (const r of transporters) {
        const name = String(r["transporter_name"] ?? "Unknown").trim() || "Unknown";
        tMap.set(name, (tMap.get(name) ?? 0) + (Number(r["transporter_balance"]) || 0));
      }
      const transporterList = [...tMap.entries()]
        .map(([name, value]) => ({ name, value }))
        .filter((t) => t.value !== 0)
        .sort((a, b) => b.value - a.value);

      // Zoho's Financial Overview is grouped by payment-for category, not by
      // the Income/Expense transaction direction.
      const fMap = new Map<string, { income: number; expense: number }>();
      for (const r of incomeExpense) {
        const paymentFor = String(r["payment_for"] ?? "").trim().toLowerCase();
        const key = paymentFor.includes("vendor") ? "Vendor Payment"
          : paymentFor.includes("client") ? "Client Payment"
            : paymentFor.includes("driver") ? "Driver Payment"
              : paymentFor.includes("diesel") ? "Diesel Payment"
                : paymentFor.includes("own") ? "Own" : "Other";
        const cur = fMap.get(key) ?? { income: 0, expense: 0 };
        cur.income += Number(r["income"]) || 0;
        cur.expense += Number(r["expense"]) || 0;
        fMap.set(key, cur);
      }
      const financeOrder = ["Client Payment", "Diesel Payment", "Vendor Payment", "Driver Payment", "Own"];
      const byType = ["Client Payment", "Diesel Payment", "Vendor Payment", "Driver Payment", "Own"]
        .map((name) => ({ name, ...(fMap.get(name) ?? { income: 0, expense: 0 }) }))
        .sort((a, b) => financeOrder.indexOf(a.name) - financeOrder.indexOf(b.name));

      const todaySalesRows = sales.filter((r) => isToday(r["entry_date"]));
      const todayRentRows = rent.filter((r) => isToday(r["entry_date"]));
      const todayDieselRows = diesel.filter((r) => isToday(r["entry_date"]));
      const todayExcavatorRows = excavatorDaily.filter((r) => isToday(r["entry_date"]));

      const isRentSource = (v: unknown) => String(v ?? "").toLowerCase().includes("rent");
      const rentBySource = (sourceIsRent: boolean) =>
        todayRentRows
          .filter((r) => {
            const src = String(r["diesel_source"] ?? "");
            const isRent = isRentSource(src);
            return sourceIsRent ? isRent : !isRent;
          })
          .reduce((s, r) => s + (Number(r["diesel_amount"]) || 0), 0);

      const directDiesel = (sourceIsRent: boolean) =>
        todayDieselRows
          .filter((r) => {
            const src = String(r["source"] ?? "");
            const isRent = isRentSource(src);
            return sourceIsRent ? isRent : !isRent;
          })
          .reduce((s, r) => s + (Number(r["diesel_amount"]) || 0), 0);

      return {
        totalClientBalance: sum(clients, "total_client_balance"),
        vendorBalance: sum(vendors, "total_vendor_balance"),
        totalDieselBalance: sum(clients, "diesel_balance"),
        driverBalance: sum(drivers, "total_driver_balance"),

        transporters: transporterList,
        transporterTotal: transporterList.reduce((s, t) => s + t.value, 0),

        finance: {
          income: sum(incomeExpense, "income"),
          expense: sum(incomeExpense, "expense"),
          byType,
        },

        today: {
          sales: sum(todaySalesRows, "sales_net_total"),
          salesCount: todaySalesRows.length,
          purchase: sum(todaySalesRows, "purchase_net_total"),
          salesIncome: sum(todaySalesRows, "sales_net_total"),
          diesel: sum(todaySalesRows, "diesel_amount"),
          driver: sum(todaySalesRows, "driver_net_total"),
          profit: sum(todaySalesRows, "profit"),
          rent: sum(todayRentRows, "rent_amount_with_gst"),
          rentCount: todayRentRows.length,
          rentDieselOwn: rentBySource(false),
          rentDieselRent: rentBySource(true),
          rentDriver: sum(todayRentRows, "driver_net_total"),
          rentProfit: sum(todayRentRows, "profit"),
          directDieselRent: directDiesel(true),
          directDieselOwn: directDiesel(false),
          excavatorLoads: sum(todayExcavatorRows, "loads_per_day"),
          excavatorTons: sum(todayExcavatorRows, "ton_per_day"),
          excavatorTonRate: sum(todayExcavatorRows, "ton_per_rate"),
          excavatorAmount: sum(todayExcavatorRows, "amount_with_gst"),
          excavatorDiesel: sum(todayExcavatorRows, "diesel_amount"),
          excavatorProfit: sum(todayExcavatorRows, "profit"),
        },

        counts: {
          clients: clientCount,
          materials: materialCount,
          drivers: driverCount,
          vehicles: vehicleCount,
          machines: machineCount,
          vendors: vendorCount,
          transporters: transporterCount,
          tyres: tyreCount,
        },
      };
    },
  });
}
