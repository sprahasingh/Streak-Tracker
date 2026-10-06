import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Response } from "express";
import { z } from "zod";
import { User } from "../models/user.model.js";
import { Category } from "../models/category.model.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();
const credentials = z.object({ email: z.string().email().max(254), password: z.string().min(10).max(128).refine(value => new TextEncoder().encode(value).length <= 72, "Password must be at most 72 UTF-8 bytes."), displayName: z.string().trim().min(1).max(80).optional(), timeZone: z.string().max(100).default("UTC") });
const registrationInput = credentials.superRefine((data, context) => {
  try { new Intl.DateTimeFormat("en", { timeZone: data.timeZone }); }
  catch { context.addIssue({ code: "custom", path: ["timeZone"], message: "Use a valid IANA timezone." }); }
});
const accessCookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
const refreshCookieOptions = { ...accessCookieOptions, path: "/api/auth" };
const accessSecret = () => process.env.JWT_ACCESS_SECRET ?? "";
const refreshSecret = () => process.env.JWT_REFRESH_SECRET ?? "";
function issue(userId: string, response: Response) {
  const accessToken = jwt.sign({}, accessSecret(), { subject: userId, expiresIn: "15m" });
  const refreshToken = jwt.sign({}, refreshSecret(), { subject: userId, expiresIn: "30d" });
  response.cookie("accessToken", accessToken, { ...accessCookieOptions, maxAge: 15 * 60_000 });
  response.cookie("refreshToken", refreshToken, { ...refreshCookieOptions, maxAge: 30 * 24 * 60 * 60_000 });
  return refreshToken;
}
function requireSecrets() { if (accessSecret().length < 32 || refreshSecret().length < 32) throw new Error("JWT secrets must each contain at least 32 characters."); }

router.post("/register", async (request, response) => {
  const parsed = registrationInput.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Check the submitted fields.", details: parsed.error.flatten() } });
  try {
    requireSecrets();
    const { email, password, displayName, timeZone } = parsed.data;
    const user = await User.create({ email, passwordHash: await bcrypt.hash(password, 12), displayName: displayName ?? email.split("@")[0], timeZone });
    const refreshToken = issue(user.id, response);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();
    await Category.insertMany([
      { userId: user.id, name: "DSA", icon: "⌘", schedule: { kind: "daily" }, sortOrder: 0, isDefault: true },
      { userId: user.id, name: "MERN Study", icon: "◈", schedule: { kind: "daily" }, sortOrder: 1, isDefault: true },
      { userId: user.id, name: "Core CS Study", icon: "▤", schedule: { kind: "daily" }, sortOrder: 2, isDefault: true },
      { userId: user.id, name: "Job Applications", icon: "↗", schedule: { kind: "weekdays" }, sortOrder: 3, isDefault: true },
    ]);
    return response.status(201).json({ user: { id: user.id, email: user.email, displayName: user.displayName, timeZone: user.timeZone } });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return response.status(409).json({ error: { code: "EMAIL_EXISTS", message: "An account with this email already exists." } });
    return response.status(500).json({ error: { code: "AUTH_ERROR", message: "Could not create account." } });
  }
});

router.post("/login", async (request, response) => {
  const parsed = credentials.pick({ email: true, password: true }).safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Enter a valid email and password." } });
  try {
    requireSecrets();
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return response.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." } });
    const refreshToken = issue(user.id, response);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();
    return response.json({ user: { id: user.id, email: user.email, displayName: user.displayName, timeZone: user.timeZone } });
  } catch { return response.status(500).json({ error: { code: "AUTH_ERROR", message: "Could not log in." } }); }
});

router.post("/refresh", async (request, response) => {
  try {
    requireSecrets();
    const decoded = jwt.verify(request.cookies?.refreshToken ?? "", refreshSecret()) as jwt.JwtPayload;
    if (typeof decoded.sub !== "string") throw new Error("Invalid subject");
    const user = await User.findById(decoded.sub).select("+refreshTokenHash");
    if (!user?.refreshTokenHash || !(await bcrypt.compare(request.cookies.refreshToken, user.refreshTokenHash))) throw new Error("Invalid refresh token");
    const refreshToken = issue(user.id, response);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();
    return response.status(204).end();
  } catch {
    response.clearCookie("accessToken", accessCookieOptions);
    response.clearCookie("refreshToken", refreshCookieOptions);
    return response.status(401).json({ error: { code: "INVALID_SESSION", message: "Please log in again." } });
  }
});

router.post("/logout", async (request, response) => {
  try {
    requireSecrets();
    const decoded = jwt.verify(request.cookies?.refreshToken ?? "", refreshSecret()) as jwt.JwtPayload;
    if (typeof decoded.sub === "string") await User.findByIdAndUpdate(decoded.sub, { $unset: { refreshTokenHash: 1 } });
  } catch { /* Clearing the browser cookies is safe even when the session has expired. */ }
  response.clearCookie("accessToken", accessCookieOptions);
  response.clearCookie("refreshToken", refreshCookieOptions);
  return response.status(204).end();
});

router.get("/me", requireAuth, async (request: AuthRequest, response) => {
  const user = await User.findById(request.userId).select("email displayName timeZone appearance");
  return user ? response.json({ user }) : response.status(404).json({ error: { code: "NOT_FOUND", message: "Account not found." } });
});

export default router;
