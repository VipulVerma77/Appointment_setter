import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/User.model.js";
import { generateAccessAndRefreshTokens } from "../utils/generateToken.js";
import jwt from "jsonwebtoken";
import { accessTokenOptions, refreshTokenOptions } from "../utils/cookieOptions.js";

// ---------------- Register ----------------
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if ([name, email, password].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const passwordValidation = (password) => {
    if (password.length < 7) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/\d/.test(password)) return false;
    if (!/[@$!%*?&]/.test(password)) return false;
    return true;
  };

  if (!passwordValidation(password)) {
    throw new ApiError(
      400,
      "Password must be at least 7 chars and contain upper, lower, number, special char"
    );
  }

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "Email already registered");

  const user = await User.create({ name, email, password, role });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  res.status(201).json(
    new ApiResponse(201, "User registered successfully. Please login to continue.", createdUser)
  );
});

// ---------------- Login ----------------
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const safeUser = await User.findById(user._id).select("-password -refreshToken");

  res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenOptions)
    .cookie("refreshToken", refreshToken, refreshTokenOptions)
    .json(
      new ApiResponse(200, "Login successful", {
        user: safeUser,
        accessToken,
        refreshToken,
      })
    );
});

// ---------------- Refresh Access Token ----------------
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(400, "Refresh token required");

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token mismatch");
  }

  // ✅ Rotate tokens
  const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

  const safeUser = await User.findById(user._id).select("-password -refreshToken");

  res
    .status(200)
    .cookie("accessToken", accessToken, accessTokenOptions)
    .cookie("refreshToken", newRefreshToken, refreshTokenOptions)
    .json(
      new ApiResponse(200, "New access token generated", {
        user: safeUser,
        accessToken,
        refreshToken: newRefreshToken,
      })
    );
});

// ---------------- Logout ----------------
export const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });

  res
    .status(200)
    .clearCookie("accessToken", accessTokenOptions)
    .clearCookie("refreshToken", refreshTokenOptions)
    .json(new ApiResponse(200, "Logged out successfully"));
});


// ---------------- Update Password ----------------
export const updatePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old and new password are required");
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");


  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) throw new ApiError(401, "Old password is incorrect");

  
  const passwordValidation = (password) => {
    if (password.length < 7) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/\d/.test(password)) return false;
    if (!/[@$!%*?&]/.test(password)) return false;
    return true;
  };

  if (!passwordValidation(newPassword)) {
    throw new ApiError(
      400,
      "Password must be at least 7 chars and contain upper, lower, number, special char"
    );
  }


  user.password = newPassword;

  user.refreshToken = undefined;

  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .clearCookie("accessToken", accessTokenOptions)
    .clearCookie("refreshToken", refreshTokenOptions)
    .json(new ApiResponse(200, "Password updated successfully. Please login again."));
});
