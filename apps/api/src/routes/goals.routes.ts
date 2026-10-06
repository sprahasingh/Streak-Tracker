import { Router } from "express";
import { z } from "zod";
import { Goal } from "../models/goal.model.js";
import { GoalProgressLog } from "../models/goal-progress-log.model.js";
import { Category } from "../models/category.model.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.middleware.js";
import { goalProgress } from "../services/goal.service.js";
import { LocalDateSchema } from "@consistency-tracker/shared";

const router = Router();
router.use(requireAuth);
const goalInput = z.object({ categoryId: z.string().min(1), title: z.string().trim().min(1).max(120), startDate: LocalDateSchema, targetDate: LocalDateSchema, metrics: z.array(z.object({ key: z.string().trim().min(1).max(40), label: z.string().trim().min(1).max(80), unit: z.string().trim().min(1).max(40), target: z.number().positive(), weight: z.number().min(0).max(100).nullable().optional() })).min(1), milestones: z.array(z.object({ percent: z.number().int().min(1).max(100), label: z.string().trim().min(1).max(120) })).optional() });
router.get("/", async (request: AuthRequest, response) => {
  const goals = await Goal.find({ userId: request.userId, status: { $ne: "archived" } }).sort({ targetDate: 1 });
  const results = await Promise.all(goals.map(async goal => {
    const logs = await GoalProgressLog.find({ userId: request.userId, goalId: goal.id });
    const values = goal.metrics.map((metric: { id: string; target: number; weight?: number | null }) => ({ target: metric.target, weight: metric.weight, value: logs.reduce((sum, log) => sum + log.changes.filter((change: { metricId: { toString(): string }; amount: number }) => change.metricId.toString() === metric.id).reduce((n: number, change: { amount: number }) => n + change.amount, 0), 0) }));
    return { goal, metrics: values, progress: goalProgress(values) };
  }));
  return response.json({ goals: results });
});
router.post("/", async (request: AuthRequest, response) => {
  const parsed = goalInput.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Check the goal fields.", details: parsed.error.flatten() } });
  if (parsed.data.startDate > parsed.data.targetDate) return response.status(400).json({ error: { code: "INVALID_DATES", message: "The target date must be on or after the start date." } });
  const weights = parsed.data.metrics.map(metric => metric.weight);
  if (weights.some(weight => weight != null) && (weights.some(weight => weight == null) || Math.abs(weights.reduce<number>((sum, weight) => sum + (weight ?? 0), 0) - 100) > 0.0001)) return response.status(400).json({ error: { code: "INVALID_WEIGHTS", message: "Provide all metric weights and make them total 100%." } });
  const category = await Category.findOne({ _id: parsed.data.categoryId, userId: request.userId });
  if (!category) return response.status(404).json({ error: { code: "CATEGORY_NOT_FOUND", message: "Category not found." } });
  const goal = await Goal.create({ ...parsed.data, userId: request.userId });
  return response.status(201).json({ goal, progress: 0 });
});
router.post("/:id/progress", async (request: AuthRequest, response) => {
  const body = z.object({ localDate: LocalDateSchema, changes: z.array(z.object({ metricId: z.string().min(1), amount: z.number().positive() })).min(1), note: z.string().max(2000).optional() }).safeParse(request.body);
  if (!body.success) return response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Check the progress update." } });
  const goal = await Goal.findOne({ _id: request.params.id, userId: request.userId, status: "active" });
  if (!goal) return response.status(404).json({ error: { code: "GOAL_NOT_FOUND", message: "Active goal not found." } });
  const currentLogs = await GoalProgressLog.find({ userId: request.userId, goalId: goal.id });
  const current = new Map<string, number>();
  for (const metric of goal.metrics) current.set(metric.id, currentLogs.reduce((sum, log) => sum + log.changes.filter((c: { metricId: { toString(): string }; amount: number }) => c.metricId.toString() === metric.id).reduce((n: number, c: { amount: number }) => n + c.amount, 0), 0));
  for (const change of body.data.changes) {
    const metric = goal.metrics.find((item: { id: string; target: number }) => item.id === change.metricId);
    if (!metric) return response.status(400).json({ error: { code: "UNKNOWN_METRIC", message: "A metric does not belong to this goal." } });
    if ((current.get(metric.id) ?? 0) + change.amount > metric.target) return response.status(400).json({ error: { code: "TARGET_EXCEEDED", message: `Progress cannot exceed the ${metric.label} target.` } });
  }
  await GoalProgressLog.create({ userId: request.userId, goalId: goal.id, ...body.data });
  const logs = await GoalProgressLog.find({ userId: request.userId, goalId: goal.id });
  const metrics = goal.metrics.map((metric: { id: string; target: number; weight?: number | null }) => ({ target: metric.target, weight: metric.weight, value: logs.reduce((sum, log) => sum + log.changes.filter((c: { metricId: { toString(): string }; amount: number }) => c.metricId.toString() === metric.id).reduce((n: number, c: { amount: number }) => n + c.amount, 0), 0) }));
  const progress = goalProgress(metrics);
  if (progress >= 100) { goal.status = "completed"; goal.completedAt = new Date(); await goal.save(); }
  return response.status(201).json({ progress, metrics, completed: progress >= 100 });
});
export default router;
