import AlertChannel from "../models/AlertChannel.js";
import AlertRule from "../models/AlertRule.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { NotFoundError } from "../utils/AppError.js";
import {
  channelSchema,
  ruleSchema,
} from "../validation/schemas.js";

// Channel CRUD
export const createChannel = asyncHandler(async (req, res) => {
  const data = channelSchema.parse(req.body);
  const channel = await AlertChannel.create({
    ...data,
    userId: req.userId,
  });
  res.status(201).json(channel);
});

export const getChannels = asyncHandler(async (req, res) => {
  res.json(
    await AlertChannel.find({ userId: req.userId }).sort({ createdAt: -1 }),
  );
});

export const getChannel = asyncHandler(async (req, res) => {
  const channel = await AlertChannel.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!channel) throw new NotFoundError("Alert channel not found");
  res.json(channel);
});

export const updateChannel = asyncHandler(async (req, res) => {
  const data = channelSchema.parse(req.body);
  const channel = await AlertChannel.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    data,
    { returnDocument: "after", runValidators: true },
  );
  if (!channel) throw new NotFoundError("Alert channel not found");
  res.json(channel);
});

export const deleteChannel = asyncHandler(async (req, res) => {
  const channel = await AlertChannel.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!channel) throw new NotFoundError("Alert channel not found");
  await channel.deleteOne();
  res.json({ message: "Alert channel deleted" });
});

// Rule CRUD
export const createRule = asyncHandler(async (req, res) => {
  const data = ruleSchema.parse(req.body);
  const rule = await AlertRule.create({ ...data, userId: req.userId });
  res.status(201).json(rule);
});

export const getRules = asyncHandler(async (req, res) => {
  res.json(
    await AlertRule.find({ userId: req.userId })
      .populate("channelIds", "name type")
      .sort({ createdAt: -1 }),
  );
});

export const getRule = asyncHandler(async (req, res) => {
  const rule = await AlertRule.findOne({
    _id: req.params.id,
    userId: req.userId,
  })
    .populate("channelIds", "name type config enabled")
    .populate("resources", "name resourceType lastStatus");
  if (!rule) throw new NotFoundError("Alert rule not found");
  res.json(rule);
});

export const updateRule = asyncHandler(async (req, res) => {
  const data = ruleSchema.partial().parse(req.body);
  const rule = await AlertRule.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    data,
    { returnDocument: "after", runValidators: true },
  );
  if (!rule) throw new NotFoundError("Alert rule not found");
  res.json(rule);
});

export const deleteRule = asyncHandler(async (req, res) => {
  const rule = await AlertRule.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!rule) throw new NotFoundError("Alert rule not found");
  await rule.deleteOne();
  res.json({ message: "Alert rule deleted" });
});
