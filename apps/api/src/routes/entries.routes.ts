import { Router } from "express";
import { z } from "zod";
import { DailyEntry } from "../models/daily-entry.model.js";
import { Category } from "../models/category.model.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.middleware.js";
import { LocalDateSchema } from "@consistency-tracker/shared";

const router = Router();
router.use(requireAuth);
const entryInput = z.object({ categoryId: z.string().min(1), localDate: LocalDateSchema, status: z.enum(["completed", "missed", "skipped"]), note: z.string().max(4000).optional() });
router.get("/", async (request: AuthRequest, response) => {
  const parsed = z.object({ from: LocalDateSchema, to: LocalDateSchema, categoryId: z.string().optional() }).safeParse(request.query);
  if (!parsed.success) return response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Provide valid from and to dates." } });
  return response.json({ entries: await DailyEntry.find({ userId: request.userId, localDate: { $gte: parsed.data.from, $lte: parsed.data.to }, ...(parsed.data.categoryId ? { categoryId: parsed.data.categoryId } : {}) }).sort({ localDate: -1 }) });
});
router.put("/", async (request: AuthRequest, response) => {
  const parsed = entryInput.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Check the entry fields.", details: parsed.error.flatten() } });
  const category = await Category.findOne({ _id: parsed.data.categoryId, userId: request.userId });
  if (!category) return response.status(404).json({ error: { code: "CATEGORY_NOT_FOUND", message: "Category not found." } });
  const user = await (await import("../models/user.model.js")).User.findById(request.userId).select("timeZone");
  try {
    const entry = await DailyEntry.findOneAndUpdate({ userId: request.userId, categoryId: category.id, localDate: parsed.data.localDate }, { $set: { ...parsed.data, userId: request.userId, timeZone: user?.timeZone ?? "UTC" } }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    return response.json({ entry });
  } catch (error) { if ((error as { code?: number }).code === 11000) return response.status(409).json({ error: { code: "ENTRY_CONFLICT", message: "An entry already exists for this date." } }); throw error; }
});
export default router;
