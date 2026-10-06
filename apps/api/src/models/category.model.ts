import { Schema, model, models } from "mongoose";

const scheduleSchema = new Schema({
  kind: { type: String, enum: ["daily", "weekdays", "selected-days", "times-per-week"], required: true },
  daysOfWeek: { type: [Number], default: undefined, validate: { validator: (days: number[]) => days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6), message: "Days must use ISO weekday values 0–6." } },
  targetPerWeek: { type: Number, min: 1, max: 7, default: undefined },
}, { _id: false });

const categorySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 60 },
  icon: { type: String, required: true, maxlength: 40 },
  accent: { type: String, maxlength: 24, default: null },
  schedule: { type: scheduleSchema, required: true },
  sortOrder: { type: Number, required: true, default: 0 },
  archivedAt: { type: Date, default: null },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

categorySchema.index({ userId: 1, name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
categorySchema.index({ userId: 1, archivedAt: 1, sortOrder: 1 });

export const Category = models.Category ?? model("Category", categorySchema);
