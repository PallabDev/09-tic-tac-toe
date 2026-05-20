import crypto from "crypto";
import jwt from "jsonwebtoken";

export const generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  });

export const generateRefreshToken = (payload) =>
  jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
  });

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");
