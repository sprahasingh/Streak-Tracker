import { Schema, model, models, type Model } from "mongoose";

const metricDeltaSchema = new Schema({
  metricId: { type: Schema.Types.ObjectId, required: true },
  amount: { type: Number, required: true },
}, { _id: false });

const goalProgressLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  goalId: { type: Schema.Types.ObjectId, ref: "Goal", required: true },
  localDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  changes: { type: [metricDeltaSchema], required: true, validate: { validator: (changes: unknown[]) => changes.length > 0, message: "A progress log needs at least one metric change." } },
  note: { type: String, maxlength: 2000, default: "" },
}, { timestamps: true, versionKey: false });

goalProgressLogSchema.index({ userId: 1, goalId: 1, localDate: -1 });

export const GoalProgressLog = (models.GoalProgressLog ?? model("GoalProgressLog", goalProgressLogSchema)) as Model<any>;
