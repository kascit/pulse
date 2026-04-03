import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    isPaused: { type: Boolean, default: false },
    lastStatus: { type: String, enum: ["up", "down", "degraded", "unknown", "pending"], default: "unknown" },
    lastCheckedAt: { type: Date, default: null },
    tags: { type: [String], default: [] },
  },
  { timestamps: true, discriminatorKey: "resourceType" }
);

resourceSchema.index({ userId: 1, createdAt: -1 });

const Resource = mongoose.model("Resource", resourceSchema);
export default Resource;
