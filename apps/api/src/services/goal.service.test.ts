import { describe, expect, it } from "vitest";
import { goalPace, goalProgress } from "./goal.service.js";

describe("goal progress", () => {
  it("averages multiple metrics equally and caps each at its target", () => {
    expect(goalProgress([{ target: 10, value: 5 }, { target: 4, value: 2 }])).toBe(50);
    expect(goalProgress([{ target: 10, value: 20 }, { target: 10, value: 0 }])).toBe(50);
  });
  it("uses weights when supplied and rejects weights that do not total 100", () => {
    expect(goalProgress([{ target: 10, value: 5, weight: 70 }, { target: 10, value: 0, weight: 30 }])).toBe(35);
    expect(() => goalProgress([{ target: 1, value: 1, weight: 40 }, { target: 1, value: 0, weight: 40 }])).toThrow();
    expect(() => goalProgress([{ target: 1, value: 1, weight: 100 }, { target: 1, value: 0 }])).toThrow();
  });
  it("calculates expected progress, status, and per-day pace", () => {
    const result = goalPace(new Date("2026-10-01T00:00:00Z"), new Date("2026-10-11T00:00:00Z"), new Date("2026-10-06T00:00:00Z"), 60, [{ target: 20, value: 2 }]);
    expect(result.expectedPercent).toBe(50);
    expect(result.status).toBe("ahead");
    expect(result.daysLeft).toBe(5);
    expect(result.requiredPerDay[0]?.perDay).toBe(3.6);
  });
});
