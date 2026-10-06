import { Schema, model, models } from "mongoose";

const metricSchema = new Schema({
  key: { type: String, required: true, trim: true, maxlength: 40 },
  label: { type: String, required: true, trim: true, maxlength: 80 },
  unit: { type: String, required: true, trim: true, maxlength: 40 },
  target: { type: Number, required: true, min: 0.000001 },
  weight: { type: Number, min: 0, max: 100, default: null },
}, { _id: true });

const milestoneSchema = new Schema({
  percent: { type: Number, required: true, min: 1, max: 100 },
  label: { type: String, required: true, trim: true, maxlength: 120 },
}, { _id: true });

const goalSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  startDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  targetDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  metrics: { type: [metricSchema], required: true, validate: { validator: (metrics: unknown[]) => metrics.length > 0, message: "A goal needs at least one metric." } },
  milestones: { type: [milestoneSchema], default: [] },
  status: { type: String, enum: ["active", "completed", "archived"], default: "active" },
  completedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

goalSchema.index({ userId: 1, status: 1, targetDate: 1 });
goalSchema.index({ userId: 1, categoryId: 1, status: 1 });

export const Goal = models.Goal ?? model("Goal", goalSchema);
