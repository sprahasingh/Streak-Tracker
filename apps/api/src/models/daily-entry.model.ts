import { Schema, model, models } from "mongoose";

const dailyEntrySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  localDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  status: { type: String, enum: ["completed", "missed", "skipped"], required: true },
  note: { type: String, maxlength: 4000, default: "" },
  timeZone: { type: String, required: true },
}, { timestamps: true, versionKey: false });

dailyEntrySchema.index({ userId: 1, categoryId: 1, localDate: 1 }, { unique: true });
dailyEntrySchema.index({ userId: 1, localDate: -1 });
dailyEntrySchema.index({ userId: 1, categoryId: 1, localDate: -1 });

export const DailyEntry = models.DailyEntry ?? model("DailyEntry", dailyEntrySchema);
