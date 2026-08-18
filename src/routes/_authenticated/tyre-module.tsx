import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Package, Wrench, Cog, Hammer, History } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVehicles } from "@/hooks/useTyres";
import {
  AUDIT_TABLE_LABELS,
  OLD_TYRE_STATUSES,
  STORAGE_PLACES,
  TYRE_ENTRY_TYPES,
  useAddServiceEntry,
  useAddTeethFitment,
  useAddTeethPurchase,
  useAddTyreFitment,
  useAddTyreInventory,
  useServiceEntries,
  useTeethFitment,
  useTeethPurchase,
  useTyreAuditLog,
  useTyreFitment,
  useTyreInventory,
  type TyreAuditLog,
} from "@/hooks/useTyreModule";

export const Route = createFileRoute("/_authenticated/tyre-module")({
  head: () => {
    const title = "Tyre Management | Sadha Groups Portal";
    const description =
      "Tyre inventory, fitment, excavator teeth, and service records for Sadha Groups fleet.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
    };
  },
  component: TyreModule,
});

function VehicleSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { data: vehicles } = useVehicles();
  return (
    <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
      <SelectTrigger>
        <SelectValue placeholder="Select vehicle" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">— None —</SelectItem>
        {(vehicles ?? []).map((v) => (
          <SelectItem key={v.id} value={v.id}>
            {v.vehicle_number}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-md bg-card shadow-panel">{children}</div>;
}

/* ================= Tyre Inventory ================= */
function TyreInventorySection() {
  const { data, isLoading } = useTyreInventory();
  const add = useAddTyreInventory();
  const [form, setForm] = useState({
    entry_type: "new",
    entry_date: new Date().toISOString().slice(0, 10),
    brand: "",
    tyre_no: "",
    tyre_size: "",
    quantity: "",
  });

  async function submit() {
    try {
      await add.mutateAsync({
        entry_type: form.entry_type,
        entry_date: form.entry_date,
        brand: form.brand.trim() || null,
        tyre_no: form.tyre_no.trim() || null,
        tyre_size: form.tyre_size.trim() || null,
        quantity: Number(form.quantity) || 0,
      });
      toast.success("Tyre stock added");
      setForm((f) => ({ ...f, brand: "", tyre_no: "", tyre_size: "", quantity: "" }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add stock");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Entry type">
            <Select value={form.entry_type} onValueChange={(v) => setForm((f) => ({ ...f, entry_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYRE_ENTRY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" value={form.entry_date} onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))} />
          </Field>
          <Field label="Brand name">
            <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
          </Field>
          <Field label="Tyre no">
            <Input value={form.tyre_no} onChange={(e) => setForm((f) => ({ ...f, tyre_no: e.target.value }))} />
          </Field>
          <Field label="Tyre size">
            <Input value={form.tyre_size} onChange={(e) => setForm((f) => ({ ...f, tyre_size: e.target.value }))} />
          </Field>
          <Field label="Quantity (no of tyres)">
            <Input type="number" min={0} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
          </Field>
        </div>
        <div className="flex justify-end border-t border-border px-4 py-3">
          <Button onClick={submit} disabled={add.isPending}>
            <Plus className="mr-2 h-4 w-4" /> Add stock
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Tyre no</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Qty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ) : (data ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-16 text-center text-muted-foreground">No tyre stock entries yet</TableCell></TableRow>
            ) : (
              (data ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.entry_date}</TableCell>
                  <TableCell className="font-medium uppercase">{r.entry_type}</TableCell>
                  <TableCell>{r.brand || "—"}</TableCell>
                  <TableCell>{r.tyre_no || "—"}</TableCell>
                  <TableCell>{r.tyre_size || "—"}</TableCell>
                  <TableCell className="text-right">{r.quantity}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

/* ================= Tyre Fitment ================= */
function TyreFitmentSection() {
  const { data, isLoading } = useTyreFitment();
  const add = useAddTyreFitment();
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    brand: "",
    tyre_no: "",
    tyre_size: "",
    vehicle_id: "",
    driver_name: "",
    tyre_place: "",
    km: "",
    remarks: "",
    old_tyre_status: "NEW",
    old_tyre_stock: "",
  });

  async function submit() {
    try {
      await add.mutateAsync({
        entry_date: form.entry_date,
        brand: form.brand.trim() || null,
        tyre_no: form.tyre_no.trim() || null,
        tyre_size: form.tyre_size.trim() || null,
        vehicle_id: form.vehicle_id || null,
        driver_name: form.driver_name.trim() || null,
        tyre_place: form.tyre_place.trim() || null,
        km: Number(form.km) || 0,
        remarks: form.remarks.trim() || null,
        old_tyre_status: form.old_tyre_status,
        old_tyre_stock: form.old_tyre_stock.trim() || null,
      });
      toast.success("Fitment recorded");
      setForm((f) => ({ ...f, brand: "", tyre_no: "", tyre_size: "", driver_name: "", tyre_place: "", km: "", remarks: "", old_tyre_stock: "" }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record fitment");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Date"><Input type="date" value={form.entry_date} onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))} /></Field>
          <Field label="Brand name"><Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} /></Field>
          <Field label="Tyre no"><Input value={form.tyre_no} onChange={(e) => setForm((f) => ({ ...f, tyre_no: e.target.value }))} /></Field>
          <Field label="Tyre size"><Input value={form.tyre_size} onChange={(e) => setForm((f) => ({ ...f, tyre_size: e.target.value }))} /></Field>
          <Field label="Vehicle no"><VehicleSelect value={form.vehicle_id} onChange={(v) => setForm((f) => ({ ...f, vehicle_id: v }))} /></Field>
          <Field label="Driver name"><Input value={form.driver_name} onChange={(e) => setForm((f) => ({ ...f, driver_name: e.target.value }))} /></Field>
          <Field label="Tyre place"><Input value={form.tyre_place} onChange={(e) => setForm((f) => ({ ...f, tyre_place: e.target.value }))} /></Field>
          <Field label="KM"><Input type="number" min={0} value={form.km} onChange={(e) => setForm((f) => ({ ...f, km: e.target.value }))} /></Field>
          <Field label="Remarks"><Input value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} /></Field>
          <Field label="Old tyre status">
            <Select value={form.old_tyre_status} onValueChange={(v) => setForm((f) => ({ ...f, old_tyre_status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OLD_TYRE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Old tyre stock"><Input value={form.old_tyre_stock} onChange={(e) => setForm((f) => ({ ...f, old_tyre_stock: e.target.value }))} /></Field>
        </div>
        <div className="flex justify-end border-t border-border px-4 py-3">
          <Button onClick={submit} disabled={add.isPending}><Plus className="mr-2 h-4 w-4" /> Record fitment</Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Tyre no</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Place</TableHead>
              <TableHead className="text-right">KM</TableHead>
              <TableHead>Old status</TableHead>
              <TableHead>Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ) : (data ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-16 text-center text-muted-foreground">No fitment records yet</TableCell></TableRow>
            ) : (
              (data ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.entry_date}</TableCell>
                  <TableCell>{r.vehicle_id || "—"}</TableCell>
                  <TableCell>{r.tyre_no || "—"}</TableCell>
                  <TableCell>{r.driver_name || "—"}</TableCell>
                  <TableCell>{r.tyre_place || "—"}</TableCell>
                  <TableCell className="text-right">{r.km}</TableCell>
                  <TableCell>{r.old_tyre_status}</TableCell>
                  <TableCell>{r.old_tyre_stock || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

/* ================= Teeth (Purchase + Fitment) ================= */
function TeethSection() {
  return (
    <div className="space-y-6">
      <TeethPurchaseSection />
      <TeethFitmentSection />
    </div>
  );
}

function TeethPurchaseSection() {
  const { data, isLoading } = useTeethPurchase();
  const add = useAddTeethPurchase();
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    purchase_shop: "",
    teeth_model: "",
    rock_teeth: "",
    washer: "",
    lock_pin: "",
    qty: "",
    storage_place: "1.CONTAINER",
  });

  async function submit() {
    try {
      await add.mutateAsync({
        entry_date: form.entry_date,
        purchase_shop: form.purchase_shop.trim() || null,
        teeth_model: form.teeth_model.trim() || null,
        rock_teeth: Number(form.rock_teeth) || 0,
        washer: Number(form.washer) || 0,
        lock_pin: Number(form.lock_pin) || 0,
        qty: Number(form.qty) || 0,
        storage_place: form.storage_place,
      });
      toast.success("Teeth purchase added");
      setForm((f) => ({ ...f, purchase_shop: "", teeth_model: "", rock_teeth: "", washer: "", lock_pin: "", qty: "" }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add teeth purchase");
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">Excavator Teeth — Purchase</h3>
      <Card>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Date"><Input type="date" value={form.entry_date} onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))} /></Field>
          <Field label="Purchase shop"><Input value={form.purchase_shop} onChange={(e) => setForm((f) => ({ ...f, purchase_shop: e.target.value }))} /></Field>
          <Field label="Teeth model"><Input value={form.teeth_model} onChange={(e) => setForm((f) => ({ ...f, teeth_model: e.target.value }))} /></Field>
          <Field label="Qty"><Input type="number" min={0} value={form.qty} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))} /></Field>
          <Field label="Rock teeth"><Input type="number" min={0} value={form.rock_teeth} onChange={(e) => setForm((f) => ({ ...f, rock_teeth: e.target.value }))} /></Field>
          <Field label="Washer"><Input type="number" min={0} value={form.washer} onChange={(e) => setForm((f) => ({ ...f, washer: e.target.value }))} /></Field>
          <Field label="Lock pin"><Input type="number" min={0} value={form.lock_pin} onChange={(e) => setForm((f) => ({ ...f, lock_pin: e.target.value }))} /></Field>
          <Field label="Storage place">
            <Select value={form.storage_place} onValueChange={(v) => setForm((f) => ({ ...f, storage_place: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STORAGE_PLACES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex justify-end border-t border-border px-4 py-3">
          <Button onClick={submit} disabled={add.isPending}><Plus className="mr-2 h-4 w-4" /> Add purchase</Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Model</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Rock</TableHead>
              <TableHead className="text-right">Washer</TableHead>
              <TableHead className="text-right">Pin</TableHead>
              <TableHead>Storage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ) : (data ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No teeth purchases yet</TableCell></TableRow>
            ) : (
              (data ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.entry_date}</TableCell>
                  <TableCell>{r.purchase_shop || "—"}</TableCell>
                  <TableCell>{r.teeth_model || "—"}</TableCell>
                  <TableCell className="text-right">{r.qty}</TableCell>
                  <TableCell className="text-right">{r.rock_teeth}</TableCell>
                  <TableCell className="text-right">{r.washer}</TableCell>
                  <TableCell className="text-right">{r.lock_pin}</TableCell>
                  <TableCell>{r.storage_place || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function TeethFitmentSection() {
  const { data, isLoading } = useTeethFitment();
  const add = useAddTeethFitment();
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    vehicle_id: "",
    new_teeth_qty: "",
    incharge_name: "",
    operator_name: "",
    km: "",
    hours: "",
    place: "",
    old_teeth_status: "",
  });

  async function submit() {
    try {
      await add.mutateAsync({
        entry_date: form.entry_date,
        vehicle_id: form.vehicle_id || null,
        new_teeth_qty: Number(form.new_teeth_qty) || 0,
        incharge_name: form.incharge_name.trim() || null,
        operator_name: form.operator_name.trim() || null,
        km: Number(form.km) || 0,
        hours: Number(form.hours) || 0,
        place: form.place.trim() || null,
        old_teeth_status: form.old_teeth_status.trim() || null,
      });
      toast.success("Teeth fitment recorded");
      setForm((f) => ({ ...f, new_teeth_qty: "", incharge_name: "", operator_name: "", km: "", hours: "", place: "", old_teeth_status: "" }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record teeth fitment");
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">Excavator Teeth — Fitment</h3>
      <Card>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Date"><Input type="date" value={form.entry_date} onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))} /></Field>
          <Field label="Vehicle no"><VehicleSelect value={form.vehicle_id} onChange={(v) => setForm((f) => ({ ...f, vehicle_id: v }))} /></Field>
          <Field label="New teeth qty"><Input type="number" min={0} value={form.new_teeth_qty} onChange={(e) => setForm((f) => ({ ...f, new_teeth_qty: e.target.value }))} /></Field>
          <Field label="Incharge name"><Input value={form.incharge_name} onChange={(e) => setForm((f) => ({ ...f, incharge_name: e.target.value }))} /></Field>
          <Field label="Operator name"><Input value={form.operator_name} onChange={(e) => setForm((f) => ({ ...f, operator_name: e.target.value }))} /></Field>
          <Field label="KM"><Input type="number" min={0} value={form.km} onChange={(e) => setForm((f) => ({ ...f, km: e.target.value }))} /></Field>
          <Field label="Hours"><Input type="number" min={0} value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} /></Field>
          <Field label="Place"><Input value={form.place} onChange={(e) => setForm((f) => ({ ...f, place: e.target.value }))} /></Field>
          <Field label="Old teeth status"><Input value={form.old_teeth_status} onChange={(e) => setForm((f) => ({ ...f, old_teeth_status: e.target.value }))} /></Field>
        </div>
        <div className="flex justify-end border-t border-border px-4 py-3">
          <Button onClick={submit} disabled={add.isPending}><Plus className="mr-2 h-4 w-4" /> Record fitment</Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Incharge</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead className="text-right">KM</TableHead>
              <TableHead className="text-right">Hrs</TableHead>
              <TableHead>Old status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ) : (data ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No teeth fitment records yet</TableCell></TableRow>
            ) : (
              (data ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.entry_date}</TableCell>
                  <TableCell>{r.vehicle_id || "—"}</TableCell>
                  <TableCell className="text-right">{r.new_teeth_qty}</TableCell>
                  <TableCell>{r.incharge_name || "—"}</TableCell>
                  <TableCell>{r.operator_name || "—"}</TableCell>
                  <TableCell className="text-right">{r.km}</TableCell>
                  <TableCell className="text-right">{r.hours}</TableCell>
                  <TableCell>{r.old_teeth_status || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

/* ================= Audit Log ================= */
function diffSummary(log: TyreAuditLog): string {
  const oldD = (log.old_data ?? {}) as Record<string, unknown>;
  const newD = (log.new_data ?? {}) as Record<string, unknown>;
  if (log.action === "INSERT") {
    const pick: string[] = [];
    for (const [k, v] of Object.entries(newD)) {
      if (["id", "created_at", "updated_at"].includes(k)) continue;
      if (v !== null && v !== undefined && v !== "") pick.push(`${k}: ${String(v)}`);
      if (pick.length >= 4) break;
    }
    return pick.length ? pick.join(" · ") : "New record created";
  }
  if (log.action === "DELETE") {
    const keys = Object.keys(oldD);
    return keys.length ? `Record removed (${keys.length} fields)` : "Record removed";
  }
  const changes: string[] = [];
  for (const k of Object.keys(newD)) {
    if (["id", "created_at", "updated_at"].includes(k)) continue;
    if (JSON.stringify(oldD[k]) !== JSON.stringify(newD[k])) {
      changes.push(`${k}: ${String(oldD[k] ?? "—")} → ${String(newD[k] ?? "—")}`);
    }
  }
  return changes.length ? changes.join(" · ") : "No field-level change captured";
}

function AuditLogSection() {
  const { data, isLoading } = useTyreAuditLog();
  const [filter, setFilter] = useState("all");

  const rows = (data ?? []).filter(
    (l) => filter === "all" || l.table_name === filter || l.action === filter,
  );

  const actionClass = (a: string) =>
    a === "INSERT" ? "text-success" : a === "DELETE" ? "text-destructive" : "text-warning";

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Tyre Maintenance Audit Trail</h3>
            <p className="text-xs text-muted-foreground">
              Every insert, update, and delete across inventory, fitment, teeth, services, and tyre positions.
            </p>
          </div>
          <div className="w-56">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All activity</SelectItem>
                <SelectItem value="INSERT">Only inserts</SelectItem>
                <SelectItem value="UPDATE">Only updates</SelectItem>
                <SelectItem value="DELETE">Only deletes</SelectItem>
                {Object.entries(AUDIT_TABLE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Changed by</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                No activity recorded yet — changes made from the other tabs will appear here.
              </TableCell></TableRow>
            ) : (
              rows.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(l.changed_at).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${actionClass(l.action)}`}>{l.action}</span>
                  </TableCell>
                  <TableCell>{AUDIT_TABLE_LABELS[l.table_name] ?? l.table_name}</TableCell>
                  <TableCell className="text-xs">{l.changed_by ? l.changed_by.slice(0, 8) : "—"}</TableCell>
                  <TableCell className="max-w-[420px] truncate text-xs" title={diffSummary(l)}>
                    {diffSummary(l)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

/* ================= Services ================= */
function ServicesSection() {
  const { data, isLoading } = useServiceEntries();
  const add = useAddServiceEntry();
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    vehicle_id: "",
    driver_name: "",
    from_km: "",
    to_km: "",
    particular: "",
    place: "",
    amount: "",
  });

  async function submit() {
    try {
      await add.mutateAsync({
        entry_date: form.entry_date,
        vehicle_id: form.vehicle_id || null,
        driver_name: form.driver_name.trim() || null,
        from_km: Number(form.from_km) || 0,
        to_km: Number(form.to_km) || 0,
        particular: form.particular.trim() || null,
        place: form.place.trim() || null,
        amount: Number(form.amount) || 0,
      });
      toast.success("Service entry added");
      setForm((f) => ({ ...f, driver_name: "", from_km: "", to_km: "", particular: "", place: "", amount: "" }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add service entry");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Date"><Input type="date" value={form.entry_date} onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))} /></Field>
          <Field label="Vehicle no"><VehicleSelect value={form.vehicle_id} onChange={(v) => setForm((f) => ({ ...f, vehicle_id: v }))} /></Field>
          <Field label="Driver name"><Input value={form.driver_name} onChange={(e) => setForm((f) => ({ ...f, driver_name: e.target.value }))} /></Field>
          <Field label="From KM"><Input type="number" min={0} value={form.from_km} onChange={(e) => setForm((f) => ({ ...f, from_km: e.target.value }))} /></Field>
          <Field label="To KM"><Input type="number" min={0} value={form.to_km} onChange={(e) => setForm((f) => ({ ...f, to_km: e.target.value }))} /></Field>
          <Field label="Particular"><Input value={form.particular} onChange={(e) => setForm((f) => ({ ...f, particular: e.target.value }))} /></Field>
          <Field label="Place"><Input value={form.place} onChange={(e) => setForm((f) => ({ ...f, place: e.target.value }))} /></Field>
          <Field label="Amount"><Input type="number" min={0} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} /></Field>
        </div>
        <div className="flex justify-end border-t border-border px-4 py-3">
          <Button onClick={submit} disabled={add.isPending}><Plus className="mr-2 h-4 w-4" /> Add service</Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>From KM</TableHead>
              <TableHead>To KM</TableHead>
              <TableHead>Particular</TableHead>
              <TableHead>Place</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ) : (data ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-16 text-center text-muted-foreground">No service records yet</TableCell></TableRow>
            ) : (
              (data ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.entry_date}</TableCell>
                  <TableCell>{r.vehicle_id || "—"}</TableCell>
                  <TableCell>{r.driver_name || "—"}</TableCell>
                  <TableCell className="text-right">{r.from_km}</TableCell>
                  <TableCell className="text-right">{r.to_km}</TableCell>
                  <TableCell>{r.particular || "—"}</TableCell>
                  <TableCell>{r.place || "—"}</TableCell>
                  <TableCell className="text-right">{r.amount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

const TABS = [
  { key: "inventory", label: "Tyre Inventory", icon: Package },
  { key: "fitment", label: "Tyre Fitment", icon: Wrench },
  { key: "teeth", label: "Excavator Teeth", icon: Hammer },
  { key: "services", label: "Services", icon: Cog },
  { key: "audit", label: "Audit Log", icon: History },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function TyreModule() {
  const [tab, setTab] = useState<TabKey>("inventory");

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="rounded-md bg-card px-5 py-4 shadow-panel">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">Tyre Management</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Purchase, fitment, excavator teeth, and service records for the fleet.
          </p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-md bg-muted p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                  tab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "inventory" && <TyreInventorySection />}
        {tab === "fitment" && <TyreFitmentSection />}
        {tab === "teeth" && <TeethSection />}
        {tab === "services" && <ServicesSection />}
        {tab === "audit" && <AuditLogSection />}
      </div>
    </AppShell>
  );
}