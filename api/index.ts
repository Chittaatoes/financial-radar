import "dotenv/config";
import express from "express";
import cors from "cors";
import serverless from "serverless-http";
import { registerRoutes } from "../backend/src/routes/index";
import { requestLogger } from "../backend/src/middleware/logger";

const app = express();
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.APP_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(requestLogger);

let isInitialized = false;

async function ensureInitialized() {
  if (isInitialized) return;

  await registerRoutes(undefined as any, app);

  app.use((err: any, _req: any, res: any, next: any) => {
    console.error("Internal Error:", err);
    if (res.headersSent) return next(err);
    res.status(500).json({ message: "Internal Server Error" });
  });

  isInitialized = true;
}

export default async function handler(req: any, res: any) {
  await ensureInitialized();
  return serverless(app)(req, res);
}