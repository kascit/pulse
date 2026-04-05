import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { ValidationError, UnauthorizedError } from "../utils/AppError.js";
import {
  registerSchema,
  loginSchema,
  updateMeSchema,
} from "../validation/schemas.js";
import { generateToken } from "../utils/jwt.js";

const saltRounds = 12;

export const register = asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);

  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) throw new ValidationError("Email already registered");

  const passwordHash = await bcrypt.hash(data.password, saltRounds);

  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash,
  });

  const token = await generateToken(user._id);
  res.status(201).json({
    token,
    user: { _id: user._id, name: user.name, email: user.email },
  });
});



export const login = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);

  const user = await User.findOne({ email: data.email });
  if (!user) throw new UnauthorizedError("Invalid credentials");

  const isValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValid) throw new UnauthorizedError("Invalid credentials");

  const token = await generateToken(user._id);
  res.json({
    token,
    user: { _id: user._id, name: user.name, email: user.email },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).select("-passwordHash");
  if (!user) throw new UnauthorizedError("User not found");
  res.json({ _id: user._id, name: user.name, email: user.email });
});

export const updateMe = asyncHandler(async (req, res) => {
  const data = updateMeSchema.parse(req.body);
  const user = await User.findById(req.userId);
  if (!user) throw new UnauthorizedError("User not found");

  if (data.name) user.name = data.name;

  if (data.email && data.email.toLowerCase() !== user.email) {
    const exists = await User.findOne({ email: data.email.toLowerCase() });
    if (exists) throw new ValidationError("Email already in use");
    user.email = data.email.toLowerCase();
  }

  if (data.newPassword) {
    const isValid = await bcrypt.compare(
      data.currentPassword,
      user.passwordHash,
    );
    if (!isValid) throw new ValidationError("Current password is incorrect");
    user.passwordHash = await bcrypt.hash(data.newPassword, saltRounds);
  }

  await user.save();
  res.json({ _id: user._id, name: user.name, email: user.email });
});



export const deleteMe = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) throw new ValidationError("Password required");

  const user = await User.findById(req.userId);
  if (!user) throw new UnauthorizedError("User not found");

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw new ValidationError("Incorrect password");

  await user.deleteOne();
  res.json({ message: "Account deleted" });
});
