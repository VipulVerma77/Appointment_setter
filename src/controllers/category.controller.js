import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Category from "../models/category.model.js";

// ---------------- Create Category (Admin only) ----------------
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim() === "") {
    throw new ApiError(400, "Category name is required");
  }

  const existing = await Category.findOne({ name });
  if (existing) throw new ApiError(409, "Category already exists");

  const category = await Category.create({ name, description });
  res.status(201).json(new ApiResponse(201, "Category created successfully", category));
});

// ---------------- Get All Categories ----------------
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 }); // alphabetically
  res.status(200).json(new ApiResponse(200, "Categories fetched successfully", categories));
});

// ---------------- Get Category by ID ----------------
export const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, "Category not found");

  res.status(200).json(new ApiResponse(200, "Category details fetched", category));
});

// ---------------- Update Category (Admin only) ----------------
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, "Category not found");

  if (name) category.name = name;
  if (description) category.description = description;

  await category.save();
  res.status(200).json(new ApiResponse(200, "Category updated successfully", category));
});

// ---------------- Delete Category (Admin only) ----------------
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, "Category not found");

  await category.remove();
  res.status(200).json(new ApiResponse(200, "Category deleted successfully"));
});
