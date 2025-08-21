// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.headers.authorization && req.headers.authorization.startsWith("Bearer")
        ? req.headers.authorization.split(" ")[1]
        : null;

    if (!token) {
      throw new ApiError(401, "Not authorized, token missing");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (without password)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      throw new ApiError(401, "User not found, invalid token");
    }

    next();
  } catch (error) {
    next(new ApiError(401, error.message || "Not authorized"));
  }
};
