import { describe, expect, it } from "vitest";
import { calculateStreak, calculateWeeklyTargetRun, isScheduled } from "./streak.service.js";

describe("scheduled streaks", () => {
  it("continues across unscheduled weekends", () => {
    const entries = new Map([["2026-10-02", "completed"], ["2026-10-05", "completed"]] as const);
    expect(calculateStreak({ kind: "weekdays" }, entries, "2026-10-05").current).toBe(2);
    expect(isScheduled({ kind: "weekdays" }, "2026-10-04")).toBe(false);
  });
  it("resets after a missing scheduled day but keeps the longest run", () => {
    const entries = new Map([["2026-10-01", "completed"], ["2026-10-02", "completed"], ["2026-10-05", "completed"]] as const);
    expect(calculateStreak({ kind: "daily" }, entries, "2026-10-05")).toEqual({ current: 1, longest: 2 });
  });
  it("does not break on an unscheduled selected day", () => {
    const entries = new Map([["2026-10-02", "completed"], ["2026-10-05", "completed"]] as const);
    expect(calculateStreak({ kind: "selected-days", daysOfWeek: [1, 3, 5] }, entries, "2026-10-05").current).toBe(2);
  });
});

describe("frequency schedules", () => {
  it("tracks target-complete weeks separately from day streaks", () => {
    const entries = new Map([["2026-09-28", "completed"], ["2026-09-30", "completed"], ["2026-10-02", "completed"], ["2026-10-05", "completed"], ["2026-10-06", "completed"]] as const);
    expect(calculateWeeklyTargetRun(2, entries, "2026-10-07")).toEqual({ currentWeeks: 2, longestWeeks: 2 });
    expect(calculateStreak({ kind: "times-per-week", targetPerWeek: 2 }, entries, "2026-10-07")).toEqual({ current: 0, longest: 0 });
  });
});
