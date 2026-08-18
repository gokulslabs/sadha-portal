import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Truck, Wand2, History, Table2, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  axlePlan,
  costPerKm,
  EVENT_TYPES,
  healthClasses,
  inr,
  inr0,
  shortKm,
  tyreHealth,
  TYRE_STATUSES,
  TYRE_TYPES,
} from "@/lib/tyres";
import {
  useAddTyreEvent,
  useProvisionTyres,
  useSaveTyre,
  useTyreEvents,
  useTyres,
  useVehicles,
  type Tyre,
} from "@/hooks/useTyres";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WHEEL_CONFIGS } from "@/lib/tyres";

export const Route = createFileRoute("/_authenticated/tyre")({
  head: () => {
    const title = "Truck Tyre View | Sadha Groups Portal";
    const description =
      "Axle-wise truck tyre management: track running km, tyre cost, cost per km, health status and full tyre life history for every vehicle in the fleet.";
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
  component: TyrePage,
  errorComponent: ({ error }) => (
    <AppShell>
      <div role="alert" className="rounded-md bg-card p-6 shadow-panel">
        <h1 className="text-base font-semibold text-foreground">Tyres didn't load</h1>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="rounded-md bg-card p-6 shadow-panel text-sm text-muted-foreground">
        No tyre data found.
      </div>
    </AppShell>
  ),
});

function TyreButton({
  tyre,
  selected,
  onSelect,
}: {
  tyre: Tyre;
  selected: boolean;
  onSelect: () => void;
}) {
  const km = Number(tyre.current_km);
  const health = tyreHealth(km);
  const cls = healthClasses[health];
  const cpk = costPerKm(Number(tyre.cost), km);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onSelect}
          aria-label={`Tyre ${tyre.position_code}, ${health}`}
          className={cn(
            "relative h-[86px] w-[86px] shrink-0 rounded-full bg-card ring-2 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4",
            cls.ring,
            selected && "ring-4 ring-primary",
          )}
        >
          <span className="absolute inset-x-0 top-2 text-[11px] font-semibold text-foreground">
            {tyre.position_code}
          </span>
          <span className="absolute inset-x-0 bottom-2 text-[9px] uppercase tracking-wide text-muted-foreground">
            {tyre.tyre_type}
          </span>
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">
            {shortKm(km)}
          </span>
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">
            {cpk > 0 ? cpk.toFixed(2) : "0.00"}
          </span>
          <span
            className={cn(
              "absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
              cls.dot,
            )}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent className="text-xs">
        <p className="font-semibold">Position {tyre.position_code}</p>
        <p>Brand: {tyre.brand || "—"}</p>
        <p>Type: {tyre.tyre_type}</p>
        <p>KM: {km.toLocaleString("en-IN")}</p>
        <p>Status: {tyre.status}</p>
        <p>Tyre cost: {inr(Number(tyre.cost))}</p>
        <p>Cost per km: {inr(cpk)}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function AxleBlock({
  label,
  tyres,
  selectedId,
  onSelect,
}: {
  label: string;
  tyres: Tyre[];
  selectedId: string | null;
  onSelect: (t: Tyre) => void;
}) {
  const right = tyres.filter((t) => /R/.test(t.position_code.replace(/^\d+/, "")));
  const left = tyres.filter((t) => /L/.test(t.position_code.replace(/^\d+/, "")));
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="space-y-2">
        {[right, left].map((row, i) => (
          <div key={i} className="flex gap-2">
            {row.map((t) => (
              <TyreButton
                key={t.id}
                tyre={t}
                selected={selectedId === t.id}
                onSelect={() => onSelect(t)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function EditTyreDialog({
  tyre,
  open,
  onOpenChange,
}: {
  tyre: Tyre;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const save = useSaveTyre();
  const [form, setForm] = useState({
    tyre_type: tyre.tyre_type,
    brand: tyre.brand ?? "",
    serial_no: tyre.serial_no ?? "",
    current_km: String(tyre.current_km),
    cost: String(tyre.cost),
    fitted_on: tyre.fitted_on ?? "",
    status: tyre.status,
    remark: tyre.remark ?? "",
  });

  useEffect(() => {
    setForm({
      tyre_type: tyre.tyre_type,
      brand: tyre.brand ?? "",
      serial_no: tyre.serial_no ?? "",
      current_km: String(tyre.current_km),
      cost: String(tyre.cost),
      fitted_on: tyre.fitted_on ?? "",
      status: tyre.status,
      remark: tyre.remark ?? "",
    });
  }, [tyre]);

  async function onSave() {
    try {
      await save.mutateAsync({
        id: tyre.id,
        tyre_type: form.tyre_type,
        brand: form.brand.trim() || null,
        serial_no: form.serial_no.trim() || null,
        current_km: Number(form.current_km) || 0,
        cost: Number(form.cost) || 0,
        status: form.status,
        fitted_on: form.fitted_on || null,
        remark: form.remark.trim() || null,
      });
      toast.success(`Tyre ${tyre.position_code} updated`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update tyre");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit tyre {tyre.position_code}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Tyre type</Label>
            <Select
              value={form.tyre_type}
              onValueChange={(v) => setForm((f) => ({ ...f, tyre_type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYRE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYRE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="serial">Serial no</Label>
            <Input
              id="serial"
              value={form.serial_no}
              onChange={(e) => setForm((f) => ({ ...f, serial_no: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="km">KM usage</Label>
            <Input
              id="km"
              type="number"
              min={0}
              value={form.current_km}
              onChange={(e) => setForm((f) => ({ ...f, current_km: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cost">Cost (₹)</Label>
            <Input
              id="cost"
              type="number"
              min={0}
              value={form.cost}
              onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fitted">Fitted on</Label>
            <Input
              id="fitted"
              type="date"
              value={form.fitted_on}
              onChange={(e) => setForm((f) => ({ ...f, fitted_on: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="remark">Remark</Label>
            <Textarea
              id="remark"
              rows={2}
              value={form.remark}
              onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={save.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistorySheet({
  tyre,
  open,
  onOpenChange,
}: {
  tyre: Tyre;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: events, isLoading } = useTyreEvents(open ? tyre.id : undefined);
  const addEvent = useAddTyreEvent();
  const [form, setForm] = useState({
    event_type: "repaired",
    event_date: new Date().toISOString().slice(0, 10),
    km_reading: "",
    cost: "",
    note: "",
  });

  async function onAdd() {
    try {
      await addEvent.mutateAsync({
        tyre_id: tyre.id,
        event_type: form.event_type,
        event_date: form.event_date,
        km_reading: Number(form.km_reading) || 0,
        cost: Number(form.cost) || 0,
        note: form.note.trim() || null,
      });
      toast.success("Event added");
      setForm((f) => ({ ...f, km_reading: "", cost: "", note: "" }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add event");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Tyre {tyre.position_code} history</SheetTitle>
        </SheetHeader>

        <div className="mt-5 space-y-3">
          {isLoading && <Skeleton className="h-16 w-full" />}
          {!isLoading && (events ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No events recorded yet.</p>
          )}
          {(events ?? []).map((e) => (
            <div key={e.id} className="rounded-md border border-border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold capitalize text-foreground">{e.event_type}</span>
                <span className="text-xs text-muted-foreground">{e.event_date}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {Number(e.km_reading).toLocaleString("en-IN")} km · {inr(Number(e.cost))}
              </p>
              {e.note && <p className="mt-1 text-xs text-foreground">{e.note}</p>}
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3 rounded-md border border-border p-3">
          <p className="text-sm font-semibold text-foreground">Add event</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.event_type}
                onValueChange={(v) => setForm((f) => ({ ...f, event_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-date">Date</Label>
              <Input
                id="ev-date"
                type="date"
                value={form.event_date}
                onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-km">KM reading</Label>
              <Input
                id="ev-km"
                type="number"
                value={form.km_reading}
                onChange={(e) => setForm((f) => ({ ...f, km_reading: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-cost">Cost (₹)</Label>
              <Input
                id="ev-cost"
                type="number"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="ev-note">Note</Label>
              <Input
                id="ev-note"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
          </div>
          <Button className="w-full" onClick={onAdd} disabled={addEvent.isPending}>
            Add event
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AddVehicleDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    vehicle_number: "",
    wheels: "6",
    odometer: "0",
  });

  useEffect(() => {
    (window as any).setAddVehicleOpen = setOpen;
  }, []);

  async function onSave() {
    try {
      const { error } = await supabase.from("vehicles").insert({
        vehicle_number: form.vehicle_number,
        wheels: Number(form.wheels),
        odometer: Number(form.odometer),
      });
      if (error) throw error;
      toast.success("Vehicle added");
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="vnum">Vehicle Number</Label>
            <Input
              id="vnum"
              placeholder="e.g. MH12TV1254"
              value={form.vehicle_number}
              onChange={(e) => setForm((f) => ({ ...f, vehicle_number: e.target.value.toUpperCase() }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Wheels</Label>
            <Select value={form.wheels} onValueChange={(v) => setForm((f) => ({ ...f, wheels: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WHEEL_CONFIGS.map((w) => (
                  <SelectItem key={w} value={String(w)}>
                    {w} Wheeler
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="odo">Odometer (KM)</Label>
            <Input
              id="odo"
              type="number"
              value={form.odometer}
              onChange={(e) => setForm((f) => ({ ...f, odometer: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSave}>Save Vehicle</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TyrePage() {
  const { data: vehicles, isLoading: loadingVehicles } = useVehicles();
  const [vehicleId, setVehicleId] = useState<string | undefined>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const vehicle = useMemo(
    () => (vehicles ?? []).find((v) => v.id === vehicleId),
    [vehicles, vehicleId],
  );

  useEffect(() => {
    if (!vehicleId && vehicles && vehicles.length > 0) setVehicleId(vehicles[0]!.id);
  }, [vehicles, vehicleId]);

  const { data: tyres, isLoading: loadingTyres } = useTyres(vehicleId);
  const provision = useProvisionTyres();

  const selected = (tyres ?? []).find((t) => t.id === selectedId) ?? null;

  const axles = useMemo(() => {
    const map = new Map<string, Tyre[]>();
    for (const t of tyres ?? []) {
      const key = t.axle_label ?? `AXLE ${parseInt(t.position_code, 10) || 0}`;
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return [...map.entries()].sort(
      (a, b) => (parseInt(a[0].replace(/\D/g, ""), 10) || 0) - (parseInt(b[0].replace(/\D/g, ""), 10) || 0),
    );
  }, [tyres]);

  const half = Math.ceil(axles.length / 2);
  const leftAxles = axles.slice(0, half);
  const rightAxles = axles.slice(half);
  const plan = vehicle ? axlePlan(vehicle.wheels) : { steer: 0, rear: 0 };

  async function onProvision() {
    if (!vehicle) return;
    try {
      const created = await provision.mutateAsync(vehicle);
      toast.success(
        created === 0 ? "All tyre positions already exist" : `${created} tyre positions created`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate positions");
    }
  }

  if (!loadingVehicles && (vehicles ?? []).length === 0) {
    return (
      <AppShell>
        <div className="rounded-md bg-card p-8 text-center shadow-panel">
          <h1 className="text-base font-semibold text-foreground">Add a vehicle first</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tyre positions are generated per vehicle from its wheel count.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TooltipProvider delayDuration={150}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-card px-5 py-4 shadow-panel">
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">
              Truck Tyre View
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={vehicleId ?? ""} onValueChange={setVehicleId}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {(vehicles ?? []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.vehicle_number} · {v.wheels} wheeler
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={onProvision} disabled={!vehicle || provision.isPending}>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Tyre Positions
              </Button>
              <Button variant="outline" onClick={() => (window as any).setAddVehicleOpen?.(true)}>
                <Truck className="mr-2 h-4 w-4" />
                Add Vehicle
              </Button>
              <Button variant="outline" asChild>
                <Link to="/tyre-report">
                  <Table2 className="mr-2 h-4 w-4" />
                  Fleet report
                </Link>
              </Button>
            </div>
          </div>

          <AddVehicleDialog />

          <div className="flex flex-wrap items-center gap-5 rounded-md bg-card px-5 py-3 text-xs shadow-panel">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-success" /> Good (&lt;50k km)
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-warning" /> Moderate (50–80k km)
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-destructive" /> Replace (&gt;80k km)
            </span>
          </div>

          <div className="rounded-md bg-card p-5 shadow-panel">
            {loadingTyres || loadingVehicles ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ) : axles.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-semibold text-foreground">No tyres set up yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use “Generate Tyre Positions” to create the {vehicle?.wheels ?? 0} positions for
                  this vehicle.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="grid min-w-[900px] grid-cols-[1fr_auto_1fr] items-start gap-5">
                  <div className="space-y-3">
                    {leftAxles.map(([label, list]) => (
                      <AxleBlock
                        key={label}
                        label={label}
                        tyres={list}
                        selectedId={selectedId}
                        onSelect={(t) => setSelectedId(t.id)}
                      />
                    ))}
                  </div>

                  <div className="flex w-[210px] flex-col items-center gap-4 self-stretch rounded-lg border-2 border-dashed border-border p-4">
                    <Truck className="h-8 w-8 text-muted-foreground" />
                    <p
                      className="text-sm font-semibold tracking-[0.25em] text-foreground"
                      style={{ writingMode: "vertical-rl" }}
                    >
                      {vehicle?.vehicle_number}
                    </p>
                    <div className="mt-auto grid w-full gap-2">
                      <StatCell label="Axles" value={String(plan.steer + plan.rear)} />
                      <StatCell
                        label="Odometer"
                        value={`${Number(vehicle?.odometer ?? 0).toLocaleString("en-IN")} km`}
                      />
                      <StatCell label="Wheels" value={String(vehicle?.wheels ?? 0)} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {rightAxles.map(([label, list]) => (
                      <AxleBlock
                        key={label}
                        label={label}
                        tyres={list}
                        selectedId={selectedId}
                        onSelect={(t) => setSelectedId(t.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Click on any tyre to view details and edit it
            </p>
          </div>

          {selected && (
            <div className="rounded-md bg-card p-5 shadow-panel">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  Tyre {selected.position_code} details
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setHistoryOpen(true)}>
                    <History className="mr-2 h-4 w-4" />
                    History
                  </Button>
                  <Button onClick={() => setEditing(true)}>Edit Tyre</Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCell label="Position" value={selected.position_code} />
                <StatCell label="Brand" value={selected.brand || "—"} />
                <StatCell label="Serial No" value={selected.serial_no || "—"} />
                <StatCell label="Type" value={selected.tyre_type} />
                <StatCell
                  label="KM Usage"
                  value={`${Number(selected.current_km).toLocaleString("en-IN")} km`}
                />
                <StatCell label="Status" value={tyreHealth(Number(selected.current_km))} />
                <StatCell label="Tyre Cost" value={inr0(Number(selected.cost))} />
                <StatCell
                  label="Cost per KM"
                  value={inr(costPerKm(Number(selected.cost), Number(selected.current_km)))}
                />
              </div>
              <EditTyreDialog tyre={selected} open={editing} onOpenChange={setEditing} />
              <HistorySheet tyre={selected} open={historyOpen} onOpenChange={setHistoryOpen} />
            </div>
          )}
        </div>
      </TooltipProvider>
    </AppShell>
  );
}
