import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, ArrowLeft, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { costPerKm, healthClasses, inr, inr0, TYRE_TYPES, tyreHealth } from "@/lib/tyres";
import { useAllTyres, useVehicles } from "@/hooks/useTyres";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tyre-report")({
  head: () => {
    const title = "Fleet Tyre Report | Sadha Groups Portal";
    const description =
      "Fleet-wide tyre report with vehicle, health, brand and type filters, total tyre cost, average running km, CSV export and a due-for-replacement list.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: TyreReport,
  errorComponent: ({ error }) => (
    <AppShell>
      <div role="alert" className="rounded-md bg-card p-6 shadow-panel text-sm">
        {error.message}
      </div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="rounded-md bg-card p-6 shadow-panel text-sm text-muted-foreground">
        No tyres found.
      </div>
    </AppShell>
  ),
});

const ALL = "all";

function TyreReport() {
  const { data: vehicles } = useVehicles();
  const { data: tyres, isLoading } = useAllTyres();
  const [vehicleId, setVehicleId] = useState(ALL);
  const [health, setHealth] = useState(ALL);
  const [brand, setBrand] = useState(ALL);
  const [type, setType] = useState(ALL);

  const vehicleName = (id: string) =>
    (vehicles ?? []).find((v) => v.id === id)?.vehicle_number ?? "—";

  const brands = useMemo(
    () => [...new Set((tyres ?? []).map((t) => t.brand).filter(Boolean) as string[])].sort(),
    [tyres],
  );

  const rows = useMemo(
    () =>
      (tyres ?? []).filter(
        (t) =>
          (vehicleId === ALL || t.vehicle_id === vehicleId) &&
          (health === ALL || tyreHealth(Number(t.current_km)) === health) &&
          (brand === ALL || t.brand === brand) &&
          (type === ALL || t.tyre_type === type),
      ),
    [tyres, vehicleId, health, brand, type],
  );

  const totalCost = rows.reduce((s, t) => s + Number(t.cost), 0);
  const avgKm = rows.length ? rows.reduce((s, t) => s + Number(t.current_km), 0) / rows.length : 0;
  const dueForReplacement = rows.filter((t) => tyreHealth(Number(t.current_km)) === "Replace");

  function exportCsv() {
    const header = [
      "Vehicle",
      "Position",
      "Brand",
      "Serial No",
      "Type",
      "KM",
      "Cost",
      "Cost per KM",
      "Health",
      "Status",
    ];
    const body = rows.map((t) => [
      vehicleName(t.vehicle_id),
      t.position_code,
      t.brand ?? "",
      t.serial_no ?? "",
      t.tyre_type,
      String(t.current_km),
      String(t.cost),
      costPerKm(Number(t.cost), Number(t.current_km)).toFixed(2),
      tyreHealth(Number(t.current_km)),
      t.status,
    ]);
    const csv = [header, ...body]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "fleet-tyre-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-card px-5 py-4 shadow-panel">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">
              Fleet Tyre Report
            </h1>
            <p className="text-xs text-muted-foreground">
              {rows.length} tyres · total cost {inr0(totalCost)} · average{" "}
              {Math.round(avgKm).toLocaleString("en-IN")} km
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/tyre">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Truck view
              </Link>
            </Button>
            <Button onClick={exportCsv} disabled={rows.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid gap-3 rounded-md bg-card p-4 shadow-panel sm:grid-cols-2 lg:grid-cols-4">
          <Select value={vehicleId} onValueChange={setVehicleId}>
            <SelectTrigger>
              <SelectValue placeholder="Vehicle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All vehicles</SelectItem>
              {(vehicles ?? []).map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.vehicle_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={health} onValueChange={setHealth}>
            <SelectTrigger>
              <SelectValue placeholder="Health" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All health</SelectItem>
              {["Good", "Moderate", "Replace"].map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger>
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {TYRE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-md bg-card shadow-panel">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No tyres match these filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Serial No</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">KM</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Cost / KM</TableHead>
                  <TableHead>Health</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => {
                  const h = tyreHealth(Number(t.current_km));
                  return (
                    <TableRow key={t.id}>
                      <TableCell>{vehicleName(t.vehicle_id)}</TableCell>
                      <TableCell className="font-medium">{t.position_code}</TableCell>
                      <TableCell>{t.brand || "—"}</TableCell>
                      <TableCell>{t.serial_no || "—"}</TableCell>
                      <TableCell>{t.tyre_type}</TableCell>
                      <TableCell className="text-right">
                        {Number(t.current_km).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right">{inr0(Number(t.cost))}</TableCell>
                      <TableCell className="text-right">
                        {inr(costPerKm(Number(t.cost), Number(t.current_km)))}
                      </TableCell>
                      <TableCell className={cn("font-medium", healthClasses[h].text)}>{h}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-md bg-card p-5 shadow-panel">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Due for replacement
          </h2>
          {dueForReplacement.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No tyres are past 80,000 km right now.
            </p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {dueForReplacement.map((t) => (
                <li key={t.id} className="rounded-md border border-destructive/40 px-3 py-2 text-sm">
                  <span className="font-medium text-foreground">
                    {vehicleName(t.vehicle_id)} · {t.position_code}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {Number(t.current_km).toLocaleString("en-IN")} km
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
