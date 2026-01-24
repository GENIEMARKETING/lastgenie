import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { apiRouter } from "./routes";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:3000",
    credentials: true
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api", apiRouter);

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

export { app };
