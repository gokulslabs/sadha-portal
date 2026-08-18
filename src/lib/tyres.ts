export const WHEEL_CONFIGS = [6, 10, 12, 14, 16, 18, 22] as const;

export const TYRE_TYPES = ["New", "Retread", "Old", "Spare"] as const;
export const TYRE_STATUSES = ["running", "removed", "scrapped"] as const;
export const EVENT_TYPES = [
  "fitted",
  "rotated",
  "repaired",
  "retread",
  "removed",
  "scrapped",
] as const;

export type AxlePlan = { steer: number; rear: number };
export type TyreHealth = "Good" | "Moderate" | "Replace";

/** Split a wheel count into steer axles (2 tyres each) and rear axles (4 tyres each). */
export function axlePlan(wheels: number): AxlePlan {
  if (wheels === 16) return { steer: 2, rear: 3 };
  if (wheels === 14) return { steer: 1, rear: 3 };
  if (wheels >= 4 && (wheels - 4) % 4 === 0) return { steer: 2, rear: (wheels - 4) / 4 };
  if (wheels >= 2 && (wheels - 2) % 4 === 0) return { steer: 1, rear: (wheels - 2) / 4 };
  return { steer: 1, rear: Math.max(0, Math.floor((wheels - 2) / 4)) };
}

/** Generate axle label + position code pairs for a wheel count. */
export function tyrePositions(wheels: number): { axle: string; pos: string }[] {
  const { steer, rear } = axlePlan(wheels);
  const out: { axle: string; pos: string }[] = [];
  let n = 0;
  for (let i = 0; i < steer; i++) {
    n += 1;
    out.push({ axle: `AXLE ${n}`, pos: `${n}R` }, { axle: `AXLE ${n}`, pos: `${n}L` });
  }
  for (let i = 0; i < rear; i++) {
    n += 1;
    out.push(
      { axle: `AXLE ${n}`, pos: `${n}RI` },
      { axle: `AXLE ${n}`, pos: `${n}RO` },
      { axle: `AXLE ${n}`, pos: `${n}LI` },
      { axle: `AXLE ${n}`, pos: `${n}LO` },
    );
  }
  return out;
}

export function tyreHealth(km: number): TyreHealth {
  return km < 50000 ? "Good" : km <= 80000 ? "Moderate" : "Replace";
}

export function costPerKm(cost: number, km: number): number {
  return km > 0 ? cost / km : 0;
}

export const healthClasses: Record<TyreHealth, { ring: string; dot: string; text: string }> = {
  Good: { ring: "ring-success/70", dot: "bg-success", text: "text-success" },
  Moderate: { ring: "ring-warning/70", dot: "bg-warning", text: "text-warning" },
  Replace: { ring: "ring-destructive/70", dot: "bg-destructive", text: "text-destructive" },
};

export const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const inr0 = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export function shortKm(km: number): string {
  if (km >= 1000) return `${Math.round(km / 100) / 10}K`.replace(".0K", "K");
  return String(Math.round(km));
}

/** Sort helper so 1R, 1L, 2RI ... order stays natural. */
export function positionSortKey(pos: string): [number, string] {
  const axle = parseInt(pos, 10) || 0;
  return [axle, pos.replace(/^\d+/, "")];
}
