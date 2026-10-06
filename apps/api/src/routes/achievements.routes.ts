import { Router } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth.middleware.js";
import { Achievement } from "../models/achievement.model.js";
import { User } from "../models/user.model.js";
import { achievementCatalog, evaluateAchievements } from "../services/achievement.service.js";

const router = Router();
router.use(requireAuth);
router.get("/", async (request: AuthRequest, response) => {
  const user = await User.findById(request.userId).select("timeZone");
  const timezone = user?.timeZone ?? "UTC";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const unlocked = await evaluateAchievements(request.userId!, today);
  const byKey = new Map(unlocked.map(item => [item.key, item.unlockedAt]));
  return response.json({ achievements: achievementCatalog.map(item => ({ ...item, unlockedAt: byKey.get(item.key) ?? null })) });
});
export default router;
