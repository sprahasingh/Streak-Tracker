import { Router } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth.middleware.js";
import { Category } from "../models/category.model.js";
import { DailyEntry } from "../models/daily-entry.model.js";
import { Goal } from "../models/goal.model.js";
import { GoalProgressLog } from "../models/goal-progress-log.model.js";
import { Achievement } from "../models/achievement.model.js";

const router=Router();router.use(requireAuth);
router.get("/",async(request:AuthRequest,response)=>{
  const format=request.query.format==="csv"?"csv":"json";
  const [categories,entries,goals,progressLogs,achievements]=await Promise.all([
    Category.find({userId:request.userId}).lean(),DailyEntry.find({userId:request.userId}).sort({localDate:1}).lean(),Goal.find({userId:request.userId}).lean(),GoalProgressLog.find({userId:request.userId}).sort({createdAt:1}).lean(),Achievement.find({userId:request.userId}).lean(),
  ]);
  if(format==="csv"){
    const escape=(value:unknown)=>`"${String(value??"").replaceAll('"','""')}"`;
    const lines=["date,category,status,note",...entries.map(entry=>{const category=categories.find(item=>String(item._id)===String(entry.categoryId));return[entry.localDate,category?.name??"",entry.status,entry.note].map(escape).join(",");})];
    response.type("text/csv").attachment("steady-entries.csv");return response.send(lines.join("\n"));
  }
  response.attachment("steady-backup.json");return response.json({exportedAt:new Date().toISOString(),categories,entries,goals,progressLogs,achievements});
});
export default router;
