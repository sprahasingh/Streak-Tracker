import { Achievement } from "../models/achievement.model.js";
import { Category } from "../models/category.model.js";
import { DailyEntry } from "../models/daily-entry.model.js";
import { Goal } from "../models/goal.model.js";
import { calculateStreak } from "./streak.service.js";

export const achievementCatalog = [
  { key: "first-checkin", title: "First step", description: "Complete your first practice.", icon: "✦" },
  { key: "streak-7", title: "A week of showing up", description: "Reach a 7 day practice streak.", icon: "♨" },
  { key: "streak-30", title: "A month of momentum", description: "Reach a 30 day practice streak.", icon: "♨" },
  { key: "goal-complete", title: "First goal complete", description: "Finish a measurable goal.", icon: "◎" },
  { key: "total-100", title: "One hundred days", description: "Complete 100 practice days across categories.", icon: "🏅" },
];

export async function evaluateAchievements(userId: string, today: string) {
  const [categories, entries, completedGoals] = await Promise.all([
    Category.find({ userId, archivedAt: null }),
    DailyEntry.find({ userId }).sort({ localDate: 1 }),
    Goal.countDocuments({ userId, status: "completed" }),
  ]);
  const completed = entries.filter(entry => entry.status === "completed");
  const keys = new Set<string>();
  if (completed.length) keys.add("first-checkin");
  if (completed.length >= 100) keys.add("total-100");
  if (completedGoals) keys.add("goal-complete");
  for (const category of categories) {
    const categoryEntries = new Map(entries.filter(entry => entry.categoryId.toString() === category.id).map(entry => [entry.localDate, entry.status]));
    const schedule = category.schedule.toObject() as { kind: "daily" | "weekdays" | "selected-days" | "times-per-week"; daysOfWeek?: number[]; targetPerWeek?: number };
    if (schedule.kind !== "times-per-week") {
      const streak = calculateStreak(schedule as Parameters<typeof calculateStreak>[0], categoryEntries, today).current;
      if (streak >= 7) keys.add("streak-7");
      if (streak >= 30) keys.add("streak-30");
    }
  }
  // Achievement inserts are idempotent through the user/key unique index.
  await Promise.all([...keys].map(key => Achievement.updateOne({ userId, key }, { $setOnInsert: { userId, key, unlockedAt: new Date() } }, { upsert: true })));
  return Achievement.find({ userId }).sort({ unlockedAt: -1 });
}
