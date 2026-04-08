import Check from "../models/Check.js";
import mongoose from "mongoose";

export const getResourceStatsData = async (resourceId, hours = 24) => {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const checks = await Check.find({
    resourceId: new mongoose.Types.ObjectId(resourceId),
    timestamp: { $gte: since },
  }).sort({ timestamp: 1 });

  const total = checks.length;
  const up = checks.filter((c) => c.isUp).length;
  const down = total - up;
  const uptimePercent = total > 0 ? (up / total) * 100 : 0;
  const avgLatency = total > 0 ? checks.reduce((s, c) => s + c.latencyMs, 0) / total : 0;

  const recentChecks = [...checks].reverse().slice(0, 20);

  let incidents = 0, totalDownMs = 0, totalBetweenFailures = 0;
  let downStart = null, lastUpTime = null;

  const bucketsMap = {};

  for (const c of checks) {
    if (!c.isUp && !downStart) {
      downStart = c.timestamp;
      incidents++;
      if (lastUpTime) totalBetweenFailures += c.timestamp - lastUpTime;
    } else if (c.isUp && downStart) {
      totalDownMs += c.timestamp - downStart;
      downStart = null;
      lastUpTime = c.timestamp;
    } else if (c.isUp) {
      lastUpTime = c.timestamp;
    }

    const hour = c.timestamp.toISOString().substring(0, 13) + ":00:00Z";
    if (!bucketsMap[hour]) bucketsMap[hour] = { checks: 0, upChecks: 0, sumLatency: 0 };
    bucketsMap[hour].checks++;
    if (c.isUp) bucketsMap[hour].upChecks++;
    bucketsMap[hour].sumLatency += c.latencyMs;
  }

  const totalMs = total > 0 ? checks[checks.length - 1].timestamp - checks[0].timestamp : 0;
  const availability = totalMs > 0 ? ((totalMs - totalDownMs) / totalMs) * 100 : 100;
  const mtbf = incidents > 0 && totalBetweenFailures > 0 ? Math.round(totalBetweenFailures / incidents / 60000) : null;
  const mttr = incidents > 0 && totalDownMs > 0 ? Math.round(totalDownMs / incidents / 60000) : null;

  const hourlyBuckets = Object.entries(bucketsMap).map(([hour, b]) => ({
    hour,
    checks: b.checks,
    upChecks: b.upChecks,
    uptime: b.checks > 0 ? (b.upChecks / b.checks) * 100 : 0,
    avgLatency: Math.round(b.sumLatency / b.checks),
  }));

  return {
    uptime: { total, up, down, uptimePercent, avgLatency },
    recentChecks,
    reliability: { incidents, mtbf, mttr, availability },
    hourlyBuckets
  };
};
