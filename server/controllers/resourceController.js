import Monitor from "../models/Monitor.js";
import Heartbeat from "../models/Heartbeat.js";
import Check from "../models/Check.js";
import { scheduleJob, cancelJob } from "../jobs/scheduler.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { NotFoundError } from "../utils/AppError.js";
import { record } from "../services/logService.js";
import { evaluate } from "../services/alertService.js";
import { monitorSchema, heartbeatSchema } from "../validation/schemas.js";

// Monitor CRUD
export const createMonitor = asyncHandler(async (req, res) => {
  const data = monitorSchema.parse(req.body);
  const monitor = await Monitor.create({ ...data, userId: req.userId });
  if (monitor.isActive && !monitor.isPaused) await scheduleJob(monitor);
  await record(
    req.userId,
    monitor,
    "resource.created",
    `Monitor "${monitor.name}" created`,
  );
  res.status(201).json(monitor);
});

export const getMonitors = asyncHandler(async (req, res) => {
  res.json(await Monitor.find({ userId: req.userId }).sort({ createdAt: -1 }));
});

export const getMonitor = asyncHandler(async (req, res) => {
  const monitor = await Monitor.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!monitor) throw new NotFoundError("Monitor not found");
  res.json(monitor);
});

export const updateMonitor = asyncHandler(async (req, res) => {
  const data = monitorSchema.partial().parse(req.body);
  const monitor = await Monitor.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    data,
    { returnDocument: "after", runValidators: true },
  );
  if (!monitor) throw new NotFoundError("Monitor not found");
  if (monitor.isActive && !monitor.isPaused) await scheduleJob(monitor);
  else cancelJob(monitor._id);
  res.json(monitor);
});

export const toggleMonitor = asyncHandler(async (req, res) => {
  const monitor = await Monitor.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!monitor) throw new NotFoundError("Monitor not found");
  monitor.isActive = !monitor.isActive;
  await monitor.save();
  if (monitor.isActive) await scheduleJob(monitor);
  else cancelJob(monitor._id);
  res.json(monitor);
});

export const deleteMonitor = asyncHandler(async (req, res) => {
  const monitor = await Monitor.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!monitor) throw new NotFoundError("Monitor not found");
  cancelJob(monitor._id);
  await record(
    req.userId,
    monitor,
    "resource.deleted",
    `Monitor "${monitor.name}" deleted`,
  );
  await Check.deleteMany({ resourceId: req.params.id });
  await monitor.deleteOne();
  res.json({ message: "Monitor deleted" });
});

// Heartbeat CRUD
export const createHeartbeat = asyncHandler(async (req, res) => {
  const data = heartbeatSchema.parse(req.body);
  const heartbeat = await Heartbeat.create({ ...data, userId: req.userId });
  await record(
    req.userId,
    heartbeat,
    "resource.created",
    `Heartbeat "${heartbeat.name}" created`,
  );
  res.status(201).json(heartbeat);
});

export const getHeartbeats = asyncHandler(async (req, res) => {
  res.json(
    await Heartbeat.find({ userId: req.userId }).sort({ createdAt: -1 }),
  );
});

export const getHeartbeat = asyncHandler(async (req, res) => {
  const heartbeat = await Heartbeat.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!heartbeat) throw new NotFoundError("Heartbeat not found");
  res.json(heartbeat);
});

export const updateHeartbeat = asyncHandler(async (req, res) => {
  const data = heartbeatSchema.partial().parse(req.body);
  const heartbeat = await Heartbeat.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    data,
    { returnDocument: "after", runValidators: true },
  );
  if (!heartbeat) throw new NotFoundError("Heartbeat not found");
  res.json(heartbeat);
});

export const deleteHeartbeat = asyncHandler(async (req, res) => {
  const heartbeat = await Heartbeat.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!heartbeat) throw new NotFoundError("Heartbeat not found");
  await record(
    req.userId,
    heartbeat,
    "resource.deleted",
    `Heartbeat "${heartbeat.name}" deleted`,
  );
  await Check.deleteMany({ resourceId: req.params.id });
  await heartbeat.deleteOne();
  res.json({ message: "Heartbeat deleted" });
});

// Public heartbeat receive
export const receiveHeartbeat = asyncHandler(async (req, res) => {
  const heartbeat = await Heartbeat.findOne({
    heartbeatToken: req.params.token,
  });
  if (!heartbeat) throw new NotFoundError("Heartbeat token not found");

  const prevStatus = heartbeat.lastStatus;
  heartbeat.lastPingedAt = new Date();
  heartbeat.lastStatus = "up";
  heartbeat.lastCheckedAt = new Date();
  await heartbeat.save();

  await Check.create({
    resourceId: heartbeat._id,
    userId: heartbeat.userId,
    statusCode: 200,
    latencyMs: 0,
    isUp: true,
    timestamp: new Date(),
  });

  if (prevStatus !== "up") {
    await record(
      heartbeat.userId,
      heartbeat,
      "resource.up",
      `Heartbeat "${heartbeat.name}" is up`,
    );
    await evaluate(heartbeat, {
      isUp: true,
      statusCode: 200,
      latencyMs: 0,
      error: null,
      prevStatus,
    });
  }

  res.json({ ok: true, name: heartbeat.name });
});
