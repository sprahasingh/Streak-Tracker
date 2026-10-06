import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthRequest = Request & { userId?: string };
export function requireAuth(request: AuthRequest, response: Response, next: NextFunction) {
  const token = request.cookies?.accessToken;
  if (!token) return response.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Please log in." } });
  try {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error("JWT_ACCESS_SECRET missing");
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    if (typeof decoded.sub !== "string") throw new Error("Invalid token subject");
    request.userId = decoded.sub;
    next();
  } catch {
    return response.status(401).json({ error: { code: "INVALID_SESSION", message: "Session expired. Please log in again." } });
  }
}
