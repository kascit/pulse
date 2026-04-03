import mongoose from "mongoose";

const LOG_EVENTS = [
  "resource.created",
  "resource.deleted",
  "resource.up",
  "resource.down",
  "resource.degraded",
  "alert.fired",
  "check.failed",
];

const logSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", index: true },
    resourceName: { type: String, required: true },
    resourceType: { type: String, required: true },
    event: { type: String, enum: LOG_EVENTS, required: true },
    message: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

logSchema.index({ userId: 1, timestamp: -1 });
logSchema.index({ resourceId: 1, timestamp: -1 });

// 30-day TTL
logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export const LOG_EVENTS_LIST = LOG_EVENTS;
export default mongoose.model("Log", logSchema);
