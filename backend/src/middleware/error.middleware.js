import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const notFoundHandler = (_req, _res, next) => {
  next(new ApiError(404, "Route not found"));
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, { errors: error.errors || [] }, message));
};
