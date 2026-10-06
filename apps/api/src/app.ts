import cors from "cors";
import express from "express";
import helmet from "helmet";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:5173", credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.get("/api/health", (_request, response) => response.status(200).json({ status: "ok" }));
  return app;
}
