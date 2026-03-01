import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { createServer } from "http";
import serverless from "serverless-http";
import { registerRoutes } from "../backend/src/routes/index";
import { requestLogger } from "../backend/src/middleware/logger";

const app = express();
app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = process.env.FRONTEND_URL;
      if (!allowed || !origin || origin === allowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(requestLogger);

let isInitialized = false;

async function ensureInitialized() {
  if (isInitialized) return;
  const httpServer = createServer(app);
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  isInitialized = true;
}

const handler = serverless(app);

export default async function (req: any, res: any) {
  await ensureInitialized();
  return handler(req, res);
}
