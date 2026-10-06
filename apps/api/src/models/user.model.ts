import { Schema, model, models, type Model } from "mongoose";

const userSchema = new Schema({
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  displayName: { type: String, required: true, trim: true, maxlength: 80 },
  timeZone: { type: String, required: true, default: "UTC" },
  appearance: { type: String, enum: ["system", "light", "dark"], default: "system" },
  refreshTokenHash: { type: String, select: false, default: undefined },
}, { timestamps: true, versionKey: false });

userSchema.index({ email: 1 }, { unique: true });

export const User = (models.User ?? model("User", userSchema)) as Model<any>;
