
import {
  LayoutDashboard,
  Fuel,
  ClipboardList,
  Mountain,
  Tractor,
  IndianRupee,
  Layers,
  UserRound,
  CircleDot,
  type LucideIcon,
} from "lucide-react";


export type NavChild = { label: string; slug: string };
export type NavItem = {
  label: string;
  icon: LucideIcon;
  to?: string;
  children?: NavChild[];
};

export const NAV: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    children: [
      { label: "Dashboard", slug: "dashboard" },
      { label: "All Reports", slug: "all-reports" },
    ],
  },
  {
    label: "Diesel",
    icon: Fuel,
    children: [
      { label: "Diesel Entries", slug: "diesel-entries" },
      { label: "Def Oil Entries", slug: "def-oil-entries" },
    ],
  },
  {
    label: "Sales",
    icon: ClipboardList,
    children: [
      { label: "Add Sales Entry", slug: "add-sales-entry" },
      { label: "Sales Entries", slug: "sales-entries" },
      { label: "Add Rent Entry", slug: "add-rent-entry" },
      { label: "Rent Entries", slug: "rent-entries" },
      { label: "Add Day Fees Entry", slug: "add-day-fees-entry" },
      { label: "Day Fees Entries", slug: "day-fees-entries" },
    ],
  },
  {
    label: "Boulders",
    icon: Mountain,
    children: [
      { label: "Boulder Reports", slug: "boulder-reports" },
      { label: "Add Boulders Entries", slug: "add-boulders-entries" },
      { label: "All Boulders Entries", slug: "all-boulders-entries" },
      { label: "Boulders Diesel Entries", slug: "boulders-diesel-entries" },
    ],
  },
  {
    label: "Excavators",
    icon: Tractor,
    children: [
      { label: "Excavator Reports", slug: "excavator-reports" },
      { label: "Machines", slug: "machines" },
      { label: "Excavators Entries", slug: "excavators-entries" },
      { label: "Excavators Daily Entries", slug: "excavators-daily-entries" },
      { label: "Excavators Rent Entries", slug: "excavators-rent-entries" },
      { label: "Excavators Diesel Entries", slug: "excavators-diesel-entries" },
    ],
  },
  {
    label: "Accounts",
    icon: IndianRupee,
    children: [
      { label: "Accounts", slug: "accounts-overview" },
      { label: "Income & Expense", slug: "income-expense" },
    ],
  },
  {
    label: "Entries",
    icon: Layers,
    children: [
      { label: "Materials", slug: "materials" },
      { label: "Vendors", slug: "vendors" },
      { label: "Clients", slug: "clients" },
      { label: "Drivers", slug: "drivers" },
      { label: "Vehicles", slug: "vehicles" },
      { label: "Material Rates", slug: "material-rates" },
      { label: "Units", slug: "units" },
      { label: "Categories", slug: "categories" },
      { label: "Sub Categories", slug: "sub-categories" },
      { label: "Payment Categories", slug: "payment-categories" },
    ],
  },
  {
    label: "Tyres",
    icon: CircleDot,
    children: [
      { label: "Truck Tyre View", slug: "tyre" },
      { label: "Fleet Tyre Report", slug: "tyre-report" },
      { label: "Tyre Module", slug: "tyre-module" },
    ],
  },
  {
    label: "Profile",
    icon: UserRound,
    children: [
      { label: "Company Profile", slug: "company-profile" },
      { label: "Transporters", slug: "transporters" },
    ],
  },

];

export function findPage(slug: string): { label: string; parent: string } | null {
  if (slug === "all-reports") return { label: "All Reports", parent: "Dashboard" };
  if (slug === "dashboard") return { label: "Dashboard", parent: "Dashboard" };
  if (slug === "tyre") return { label: "Truck Tyre View", parent: "Tyres" };
  if (slug === "tyre-report") return { label: "Fleet Tyre Report", parent: "Tyres" };
  if (slug === "tyre-module") return { label: "Tyre Module", parent: "Tyres" };
  for (const item of NAV) {
    for (const child of item.children ?? []) {
      if (child.slug === slug) return { label: child.label, parent: item.label };
    }
  }
  return null;
}
