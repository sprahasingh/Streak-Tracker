export type Schedule =
  | { kind: "daily" }
  | { kind: "weekdays" }
  | { kind: "selected-days"; daysOfWeek: number[] }
  | { kind: "times-per-week"; targetPerWeek: number };
export type EntryState = "completed" | "missed" | "skipped" | undefined;

function weekday(date: string): number { return new Date(`${date}T00:00:00Z`).getUTCDay(); }
export function isScheduled(schedule: Schedule, date: string): boolean {
  const day = weekday(date);
  if (schedule.kind === "daily") return true;
  if (schedule.kind === "times-per-week") return false;
  if (schedule.kind === "weekdays") return day >= 1 && day <= 5;
  return schedule.daysOfWeek.includes(day);
}
function previousDate(date: string): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}
function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function calculateStreak(schedule: Schedule, entries: Map<string, EntryState>, today: string) {
  if (schedule.kind === "times-per-week") return { current: 0, longest: 0 };
  let current = 0;
  let cursor = today;
  let started = false;
  while (cursor >= "0000-01-01") {
    if (isScheduled(schedule, cursor)) {
      const state = entries.get(cursor);
      if (!started && state === undefined && cursor === today) { cursor = previousDate(cursor); continue; }
      started = true;
      if (state !== "completed") break;
      current += 1;
    }
    cursor = previousDate(cursor);
  }
  let longest = 0;
  let run = 0;
  const dates = [...entries.keys()].sort();
  if (dates.length) {
    let cursor = dates[0]!;
    const last = dates[dates.length - 1]!;
    while (cursor <= last) {
      if (isScheduled(schedule, cursor)) {
        if (entries.get(cursor) === "completed") { run += 1; longest = Math.max(longest, run); }
        else run = 0;
      }
      cursor = addDays(cursor, 1);
    }
  }
  return { current, longest };
}

function weekStart(date: string): string {
  const value = new Date(`${date}T00:00:00Z`);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - day + 1);
  return value.toISOString().slice(0, 10);
}
export function calculateWeeklyTargetRun(targetPerWeek: number, entries: Map<string, EntryState>, today: string) {
  if (!Number.isInteger(targetPerWeek) || targetPerWeek < 1 || targetPerWeek > 7) throw new Error("Weekly target must be between 1 and 7.");
  const completedByWeek = new Map<string, number>();
  for (const [date, state] of entries) if (state === "completed") {
    const start = weekStart(date);
    completedByWeek.set(start, (completedByWeek.get(start) ?? 0) + 1);
  }
  let cursor = weekStart(today);
  let current = 0;
  if ((completedByWeek.get(cursor) ?? 0) < targetPerWeek) cursor = addDays(cursor, -7);
  while ((completedByWeek.get(cursor) ?? 0) >= targetPerWeek) { current++; cursor = addDays(cursor, -7); }
  let longest = 0;
  let run = 0;
  const weeks = [...completedByWeek.keys()].sort();
  if (weeks.length) {
    let week = weekStart(weeks[0]!);
    const last = weekStart(weeks[weeks.length - 1]!);
    while (week <= last) {
      if ((completedByWeek.get(week) ?? 0) >= targetPerWeek) { run++; longest = Math.max(longest, run); }
      else run = 0;
      week = addDays(week, 7);
    }
  }
  return { currentWeeks: current, longestWeeks: longest };
}
