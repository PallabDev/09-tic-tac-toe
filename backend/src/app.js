import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import roomRoutes from "./routes/room.routes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Backend running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
