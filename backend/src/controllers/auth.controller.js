import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../utils/token.js";

const buildAuthPayload = (user) => ({ _id: user._id, email: user.email });

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

export const registerUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "Email is already registered");
  }

  const user = await User.create({ email, password });

  return res
    .status(201)
    .json(new ApiResponse(201, { user: { _id: user._id, email: user.email } }, "Registered successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });

  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const payload = buildAuthPayload(user);
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  user.hashedRefreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  return res
    .cookie("refreshToken", refreshToken, cookieOptions)
    .status(200)
    .json(new ApiResponse(200, { accessToken, user: { _id: user._id, email: user.email } }, "Logged in"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies.refreshToken;
  if (!incomingToken) throw new ApiError(401, "Refresh token missing");

  const decoded = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findById(decoded._id);

  if (!user || !user.hashedRefreshToken) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (user.hashedRefreshToken !== hashToken(incomingToken)) {
    throw new ApiError(401, "Refresh token has expired");
  }

  const payload = buildAuthPayload(user);
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);
  user.hashedRefreshToken = hashToken(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  return res
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .status(200)
    .json(new ApiResponse(200, { accessToken: newAccessToken }, "Token refreshed"));
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $set: { hashedRefreshToken: null } });
  return res
    .clearCookie("refreshToken", cookieOptions)
    .status(200)
    .json(new ApiResponse(200, null, "Logged out"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { user: req.user }, "User fetched"));
});
