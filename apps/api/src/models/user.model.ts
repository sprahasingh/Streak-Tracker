import { Schema, model, models } from "mongoose";

const userSchema = new Schema({
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  displayName: { type: String, required: true, trim: true, maxlength: 80 },
  timeZone: { type: String, required: true, default: "UTC" },
  appearance: { type: String, enum: ["system", "light", "dark"], default: "system" },
}, { timestamps: true, versionKey: false });

userSchema.index({ email: 1 }, { unique: true });

export const User = models.User ?? model("User", userSchema);
