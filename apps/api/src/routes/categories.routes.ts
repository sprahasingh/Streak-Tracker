import { Router } from "express";
import { z } from "zod";
import { Category } from "../models/category.model.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();
router.use(requireAuth);
const inputSchema = z.object({ name: z.string().trim().min(1).max(60), icon: z.string().min(1).max(40), accent: z.string().max(24).nullable().optional(), schedule: z.discriminatedUnion("kind", [z.object({ kind: z.literal("daily") }), z.object({ kind: z.literal("weekdays") }), z.object({ kind: z.literal("selected-days"), daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).max(7) }), z.object({ kind: z.literal("times-per-week"), targetPerWeek: z.number().int().min(1).max(7) })]), sortOrder: z.number().int().default(0) });
router.get("/", async (request: AuthRequest, response) => response.json({ categories: await Category.find({ userId: request.userId }).sort({ archivedAt: 1, sortOrder: 1 }) }));
router.post("/", async (request: AuthRequest, response) => {
  const parsed = inputSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Check the category fields.", details: parsed.error.flatten() } });
  try { return response.status(201).json({ category: await Category.create({ ...parsed.data, userId: request.userId }) }); }
  catch (error) { if ((error as { code?: number }).code === 11000) return response.status(409).json({ error: { code: "DUPLICATE_CATEGORY", message: "That category name is already in use." } }); throw error; }
});
router.patch("/:id", async (request: AuthRequest, response) => {
  const parsed = inputSchema.partial().safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Check the category fields." } });
  const category = await Category.findOneAndUpdate({ _id: request.params.id, userId: request.userId }, { $set: parsed.data }, { new: true, runValidators: true });
  return category ? response.json({ category }) : response.status(404).json({ error: { code: "NOT_FOUND", message: "Category not found." } });
});
router.delete("/:id", async (request: AuthRequest, response) => {
  const category = await Category.findOneAndUpdate({ _id: request.params.id, userId: request.userId }, { $set: { archivedAt: new Date() } }, { new: true });
  return category ? response.json({ category }) : response.status(404).json({ error: { code: "NOT_FOUND", message: "Category not found." } });
});
export default router;
