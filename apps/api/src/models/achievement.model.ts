import { Schema, model, models, type Model } from "mongoose";

const achievementSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  key: { type: String, required: true, maxlength: 100 },
  unlockedAt: { type: Date, required: true },
  context: { type: Schema.Types.Mixed, default: undefined },
}, { timestamps: true, versionKey: false });

achievementSchema.index({ userId: 1, key: 1 }, { unique: true });
achievementSchema.index({ userId: 1, unlockedAt: -1 });

export const Achievement = (models.Achievement ?? model("Achievement", achievementSchema)) as Model<any>;
