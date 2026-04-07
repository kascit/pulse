import StatusPage from "../models/StatusPage.js";
import Log from "../models/Log.js";
import Resource from "../models/Resource.js";
import { getResourceStatsData } from "../services/statsService.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { NotFoundError } from "../utils/AppError.js";
import { statusPageSchema } from "../validation/schemas.js";

const clampNumber = (value, { min, max, fallback }) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
};

// Status Page CRUD
export const createStatusPage = asyncHandler(async (req, res) => {
  const data = statusPageSchema.parse(req.body);
  const existing = await StatusPage.findOne({ slug: data.slug });
  if (existing) return res.status(409).json({ error: "Slug already taken" });
  const page = await StatusPage.create({ ...data, userId: req.userId });
  res.status(201).json(page);
});

export const getStatusPages = asyncHandler(async (req, res) => {
  res.json(
    await StatusPage.find({ userId: req.userId }).sort({ createdAt: -1 }),
  );
});

export const getStatusPage = asyncHandler(async (req, res) => {
  const page = await StatusPage.findOne({
    _id: req.params.id,
    userId: req.userId,
  }).populate("resources", "name resourceType lastStatus lastCheckedAt");
  if (!page) throw new NotFoundError("Status page not found");
  res.json(page);
});

export const updateStatusPage = asyncHandler(async (req, res) => {
  const data = statusPageSchema.partial().parse(req.body);
  if (data.slug) {
    const existing = await StatusPage.findOne({
      slug: data.slug,
      _id: { $ne: req.params.id },
    });
    if (existing) return res.status(409).json({ error: "Slug already taken" });
  }
  const page = await StatusPage.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    data,
    { returnDocument: "after", runValidators: true },
  );
  if (!page) throw new NotFoundError("Status page not found");
  res.json(page);
});

export const deleteStatusPage = asyncHandler(async (req, res) => {
  const page = await StatusPage.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!page) throw new NotFoundError("Status page not found");
  await page.deleteOne();
  res.json({ message: "Status page deleted" });
});

// Logs
export const getLogs = asyncHandler(async (req, res) => {
  const { resourceId, event, limit = 50, page = 1 } = req.query;
  const filter = { userId: req.userId };
  if (resourceId) filter.resourceId = resourceId;
  if (event) filter.event = event;

  const limitNum = clampNumber(limit, { min: 1, max: 100, fallback: 50 });
  const pageNum = clampNumber(page, { min: 1, max: 100000, fallback: 1 });

  const logs = await Log.find(filter)
    .sort({ timestamp: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);
  const total = await Log.countDocuments(filter);
  res.json({ logs, total, page: pageNum, limit: limitNum });
});

export const getLog = asyncHandler(async (req, res) => {
  const log = await Log.findOne({ _id: req.params.id, userId: req.userId });
  if (!log) throw new NotFoundError("Log not found");
  res.json(log);
});

// Stats
export const getResourceStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { hours = 24 } = req.query;

  const resource = await Resource.findOne({ _id: id, userId: req.userId });
  if (!resource) throw new NotFoundError("Resource not found");

  const hoursNum = clampNumber(hours, { min: 1, max: 168, fallback: 24 });
  const stats = await getResourceStatsData(id, hoursNum);

  res.json({
    uptime: Math.round(stats.uptime.uptimePercent * 100) / 100,
    avgLatency: Math.round(stats.uptime.avgLatency),
    totalChecks: stats.uptime.total,
    upChecks: stats.uptime.up,
    downChecks: stats.uptime.down,
    reliability: stats.reliability,
    hourlyBuckets: stats.hourlyBuckets,
    recentChecks: stats.recentChecks.map((c) => ({
      timestamp: c.timestamp,
      isUp: c.isUp,
      latencyMs: c.latencyMs,
      statusCode: c.statusCode,
      error: c.error,
    })),
  });
});

// Public
export const getPublicStatusPage = asyncHandler(async (req, res) => {
  const page = await StatusPage.findOne({ slug: req.params.slug }).populate(
    "resources",
    "name resourceType lastStatus lastCheckedAt tags",
  );

  if (!page) throw new NotFoundError("Status page not found");
  if (page.isPaused) {
    return res.json({
      isPaused: true,
      name: page.name,
      slug: page.slug,
      description: page.description,
    });
  }

  const resourcesWithStats = await Promise.all(
    page.resources.map(async (resource) => {
      const stats = await getResourceStatsData(resource._id, 24);
      return {
        _id: resource._id,
        name: resource.name,
        resourceType: resource.resourceType,
        lastStatus: resource.lastStatus,
        lastCheckedAt: resource.lastCheckedAt,
        tags: resource.tags,
        stats: {
          uptime: Math.round(stats.uptime.uptimePercent * 100) / 100,
          avgLatency: Math.round(stats.uptime.avgLatency),
          totalChecks: stats.uptime.total,
        },
        recentChecks: stats.recentChecks.slice(0, 10).map((c) => ({
          timestamp: c.timestamp,
          isUp: c.isUp,
          latencyMs: c.latencyMs,
          statusCode: c.statusCode,
        })),
      };
    }),
  );

  res.json({
    name: page.name,
    slug: page.slug,
    description: page.description,
    resources: resourcesWithStats,
  });
});
