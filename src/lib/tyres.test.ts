import { describe, expect, it } from "vitest";
import { axlePlan, costPerKm, tyreHealth, tyrePositions, WHEEL_CONFIGS } from "./tyres";

describe("axlePlan", () => {
  it("handles supported wheel configs with the right tyre count", () => {
    for (const wheels of WHEEL_CONFIGS) {
      const { steer, rear } = axlePlan(wheels);
      expect(steer * 2 + rear * 4).toBe(wheels);
    }
  });

  it("uses two steer axles when the remainder allows it", () => {
    expect(axlePlan(12)).toEqual({ steer: 2, rear: 2 });
    expect(axlePlan(16)).toEqual({ steer: 2, rear: 3 });
  });

  it("falls back to a single steer axle", () => {
    expect(axlePlan(6)).toEqual({ steer: 1, rear: 1 });
    expect(axlePlan(10)).toEqual({ steer: 1, rear: 2 });
    expect(axlePlan(22)).toEqual({ steer: 1, rear: 5 });
  });
});

describe("tyrePositions", () => {
  it("generates one entry per wheel", () => {
    for (const wheels of WHEEL_CONFIGS) {
      expect(tyrePositions(wheels)).toHaveLength(wheels);
    }
  });

  it("codes steer and rear axles correctly", () => {
    expect(tyrePositions(6).map((p) => p.pos)).toEqual(["1R", "1L", "2RI", "2RO", "2LI", "2LO"]);
  });

  it("labels axles sequentially", () => {
    const axles = [...new Set(tyrePositions(22).map((p) => p.axle))];
    expect(axles).toEqual(["AXLE 1", "AXLE 2", "AXLE 3", "AXLE 4", "AXLE 5", "AXLE 6"]);
  });

  it("has unique position codes", () => {
    const pos = tyrePositions(18).map((p) => p.pos);
    expect(new Set(pos).size).toBe(pos.length);
  });
});

describe("tyreHealth", () => {
  it("maps km to health bands", () => {
    expect(tyreHealth(0)).toBe("Good");
    expect(tyreHealth(49999)).toBe("Good");
    expect(tyreHealth(50000)).toBe("Moderate");
    expect(tyreHealth(80000)).toBe("Moderate");
    expect(tyreHealth(85000)).toBe("Replace");
  });
});

describe("costPerKm", () => {
  it("divides cost by km", () => {
    expect(costPerKm(20000, 50000)).toBeCloseTo(0.4);
  });
  it("returns 0 when km is 0", () => {
    expect(costPerKm(20000, 0)).toBe(0);
  });
});
