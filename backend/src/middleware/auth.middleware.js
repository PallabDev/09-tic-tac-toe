import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const user = await User.findById(decoded._id).select("-password -hashedRefreshToken");

  if (!user) {
    throw new ApiError(401, "Invalid access token");
  }

  req.user = user;
  next();
});
