import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  register,
  login,
  getMe,
  updateMe,
  deleteMe,
} from "../controllers/authController.js";
import {
  createMonitor,
  getMonitors,
  getMonitor,
  updateMonitor,
  toggleMonitor,
  deleteMonitor,
  createHeartbeat,
  getHeartbeats,
  getHeartbeat,
  updateHeartbeat,
  deleteHeartbeat,
  receiveHeartbeat,
} from "../controllers/resourceController.js";
import {
  createChannel,
  getChannels,
  getChannel,
  updateChannel,
  deleteChannel,
  createRule,
  getRules,
  getRule,
  updateRule,
  deleteRule,
} from "../controllers/alertController.js";
import {
  createStatusPage,
  getStatusPages,
  getStatusPage,
  updateStatusPage,
  deleteStatusPage,
  getLogs,
  getLog,
  getResourceStats,
  getPublicStatusPage,
} from "../controllers/miscController.js";

const router = express.Router();



// Auth routes
const authRouter = express.Router();
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", authMiddleware, getMe);
authRouter.patch("/me", authMiddleware, updateMe);
authRouter.delete("/me", authMiddleware, deleteMe);
router.use("/auth", authRouter);

// Monitors
const monitorRouter = express.Router();
monitorRouter.use(authMiddleware);
monitorRouter.post("/", createMonitor);
monitorRouter.get("/", getMonitors);
monitorRouter.get("/:id", getMonitor);
monitorRouter.put("/:id", updateMonitor);
monitorRouter.patch("/:id/toggle", toggleMonitor);
monitorRouter.delete("/:id", deleteMonitor);
router.use("/monitors", monitorRouter);

// Heartbeats
const heartbeatRouter = express.Router();
heartbeatRouter.use(authMiddleware);
heartbeatRouter.post("/", createHeartbeat);
heartbeatRouter.get("/", getHeartbeats);
heartbeatRouter.get("/:id", getHeartbeat);
heartbeatRouter.put("/:id", updateHeartbeat);
heartbeatRouter.delete("/:id", deleteHeartbeat);
router.use("/heartbeats", heartbeatRouter);

// Heartbeat receive (public)
router.post("/heartbeat/:token", receiveHeartbeat);

// Alert channels & rules
const alertRouter = express.Router();
alertRouter.use(authMiddleware);
alertRouter.post("/channels", createChannel);
alertRouter.get("/channels", getChannels);
alertRouter.get("/channels/:id", getChannel);
alertRouter.put("/channels/:id", updateChannel);
alertRouter.delete("/channels/:id", deleteChannel);
alertRouter.post("/rules", createRule);
alertRouter.get("/rules", getRules);
alertRouter.get("/rules/:id", getRule);
alertRouter.put("/rules/:id", updateRule);
alertRouter.delete("/rules/:id", deleteRule);
router.use("/alerts", alertRouter);

// Status pages
const statusPageRouter = express.Router();
statusPageRouter.use(authMiddleware);
statusPageRouter.post("/", createStatusPage);
statusPageRouter.get("/", getStatusPages);
statusPageRouter.get("/:id", getStatusPage);
statusPageRouter.put("/:id", updateStatusPage);
statusPageRouter.delete("/:id", deleteStatusPage);
router.use("/status-pages", statusPageRouter);

// Logs
const logsRouter = express.Router();
logsRouter.use(authMiddleware);
logsRouter.get("/", getLogs);
logsRouter.get("/:id", getLog);
router.use("/logs", logsRouter);

// Stats
const statsRouter = express.Router();
statsRouter.use(authMiddleware);
statsRouter.get("/:id", getResourceStats);
router.use("/stats", statsRouter);

// Public (no auth)
const publicRouter = express.Router();
publicRouter.get("/:slug", getPublicStatusPage);
router.use("/public", publicRouter);

export default router;
