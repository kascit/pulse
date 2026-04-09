import cron from "node-cron";
import Monitor from "../models/Monitor.js";
import Heartbeat from "../models/Heartbeat.js";
import Check from "../models/Check.js";
import { runCheck } from "../services/checkService.js";
import { record } from "../services/logService.js";
import { evaluate } from "../services/alertService.js";

const jobs = new Map();

const getCronExpression = (intervalMinutes) => {
  const map = { 1: "* * * * *", 5: "*/5 * * * *", 15: "*/15 * * * *", 30: "*/30 * * * *", 60: "0 * * * *" };
  return map[intervalMinutes] || "*/5 * * * *";
};

export const scheduleJob = async (monitor) => {
  cancelJob(monitor._id);
  if (!monitor.isActive || monitor.isPaused) return;

  const task = cron.schedule(
    getCronExpression(monitor.intervalMinutes),
    async () => {
      try {
        const fresh = await Monitor.findById(monitor._id);
        if (!fresh || !fresh.isActive || fresh.isPaused) return cancelJob(monitor._id);
        await runCheck(fresh);
      } catch (err) {
        console.error(`[scheduler] Check failed for monitor ${monitor._id}:`, err.message);
      }
    },
    { scheduled: true, timezone: "UTC" }
  );

  jobs.set(monitor._id.toString(), task);
  console.log(`[scheduler] Scheduled monitor ${monitor.name} (every ${monitor.intervalMinutes}m)`);
};

export const cancelJob = (monitorId) => {
  const job = jobs.get(monitorId.toString());
  if (job) {
    job.stop();
    jobs.delete(monitorId.toString());
  }
};

export const initializeScheduler = async () => {
  console.log("[scheduler] Initializing...");

  const activeMonitors = await Monitor.find({ isActive: true, isPaused: { $ne: true } });
  for (const monitor of activeMonitors) await scheduleJob(monitor);
  console.log(`[scheduler] Scheduled ${activeMonitors.length} monitors`);

  startHeartbeatCleanup();
  console.log("[scheduler] Ready");
};

const startHeartbeatCleanup = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const heartbeats = await Heartbeat.find({ isActive: true, isPaused: { $ne: true } });

      for (const hb of heartbeats) {
        const cutoff = new Date(now - hb.graceMinutes * 60 * 1000);
        const isStale = !hb.lastPingedAt || hb.lastPingedAt < cutoff;
        if (!isStale || hb.lastStatus === "down") continue;

        hb.lastStatus = "down";
        hb.lastCheckedAt = now;
        await hb.save();

        await Check.create({
          resourceId: hb._id,
          userId: hb.userId,
          statusCode: 0,
          latencyMs: 0,
          isUp: false,
          error: `No ping received within ${hb.graceMinutes} minute grace period`,
          timestamp: now,
        });

        await record(hb.userId, hb, "resource.down", `Heartbeat "${hb.name}" missed — no ping received`);
        await evaluate(hb, { isUp: false, statusCode: 0, latencyMs: 0, error: "Heartbeat missed" });
      }
    } catch (err) {
      console.error("[scheduler] Heartbeat cleanup error:", err.message);
    }
  });
};

export const getJobCount = () => jobs.size;
