import { Router } from "express";
import { z } from "zod";
import { Category } from "../models/category.model.js";
import { DailyEntry } from "../models/daily-entry.model.js";
import { User } from "../models/user.model.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.middleware.js";
import { calculateStreak, calculateWeeklyTargetRun, isScheduled, type EntryState } from "../services/streak.service.js";
import { LocalDateSchema } from "@consistency-tracker/shared";

const router = Router();
router.use(requireAuth);
const shiftDate = (date: string, amount: number) => { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + amount); return value.toISOString().slice(0, 10); };
const mondayOf = (date:string) => {const value=new Date(`${date}T00:00:00Z`);const day=value.getUTCDay()||7;value.setUTCDate(value.getUTCDate()-day+1);return value.toISOString().slice(0,10);};
router.get("/", async (request: AuthRequest, response) => {
  const parsed = z.object({ from: LocalDateSchema.optional(), to: LocalDateSchema.optional(), categoryId: z.string().optional() }).safeParse(request.query);
  if (!parsed.success) return response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid date range." } });
  const user = await User.findById(request.userId).select("timeZone");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: user?.timeZone ?? "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const to = parsed.data.to ?? today;
  const from = parsed.data.from ?? shiftDate(to, -89);
  if (from > to) return response.status(400).json({ error: { code: "INVALID_DATES", message: "Start date must not follow end date." } });
  const [categories, entries] = await Promise.all([
    Category.find({ userId: request.userId, ...(parsed.data.categoryId ? { _id: parsed.data.categoryId } : {}) }).sort({ sortOrder: 1 }),
    DailyEntry.find({ userId: request.userId, ...(parsed.data.categoryId ? { categoryId: parsed.data.categoryId } : {}) }).sort({ localDate: 1 }),
  ]);
  const entryIndex = new Map(entries.map(entry => [`${entry.categoryId}:${entry.localDate}`, entry]));
  const daily = [] as { date: string; scheduled: number; completed: number; percent: number }[];
  for (let date = from; date <= to; date = shiftDate(date, 1)) {
    let scheduled = 0; let completed = 0;
    for (const category of categories) if (isScheduled(category.schedule.toObject() as Parameters<typeof isScheduled>[0], date)) {
      scheduled++;
      if (entryIndex.get(`${category.id}:${date}`)?.status === "completed") completed++;
    }
    daily.push({ date, scheduled, completed, percent: scheduled ? Math.round(completed / scheduled * 100) : 0 });
  }
  const categoryStats = categories.map(category => {
    const schedule = category.schedule.toObject() as Parameters<typeof calculateStreak>[0];
    const allEntries = entries.filter(entry => entry.categoryId.toString() === category.id);
    const rangeEntries = allEntries.filter(entry => entry.localDate >= from && entry.localDate <= to);
    const states = new Map<string, EntryState>(allEntries.map(entry => [entry.localDate, entry.status]));
    let scheduled = 0; let completed = 0;
    for (let date = from; date <= to; date = shiftDate(date, 1)) if (isScheduled(schedule, date)) { scheduled++; if (states.get(date) === "completed") completed++; }
    const frequency=schedule.kind==="times-per-week";
    const frequencyRun=frequency?calculateWeeklyTargetRun(schedule.targetPerWeek??1,states,to):undefined;
    const streak = frequency?{current:frequencyRun!.currentWeeks,longest:frequencyRun!.longestWeeks}:calculateStreak(schedule, states, to);
    if(frequency){let met=0;const first=mondayOf(from);const last=mondayOf(to);for(let week=first;week<=last;week=shiftDate(week,7)){const completedCount=allEntries.filter(entry=>entry.status==="completed"&&mondayOf(entry.localDate)===week).length;if(completedCount>=(schedule.targetPerWeek??1))met++;}const weekCount=Math.floor((new Date(`${last}T00:00:00Z`).getTime()-new Date(`${first}T00:00:00Z`).getTime())/604_800_000)+1;scheduled=weekCount;completed=met;}
    const items = rangeEntries.map(entry => ({ id: entry.id, date: entry.localDate, status: entry.status, note: entry.note }));
    return { category: { id: category.id, name: category.name, icon: category.icon, schedule }, currentStreak: streak.current, longestStreak: streak.longest, streakUnit:frequency?"weeks":"days", totalCompleted: allEntries.filter(entry => entry.status === "completed").length, completionRate: scheduled ? Math.round(completed / scheduled * 100) : 0, entries: items };
  });
  return response.json({ from, to, daily, categories: categoryStats, totals: { scheduled: daily.reduce((n, day) => n + day.scheduled, 0), completed: daily.reduce((n, day) => n + day.completed, 0) } });
});
export default router;
