import mongoose from "mongoose";

const checkSchema = new mongoose.Schema(
  {
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    statusCode: { type: Number, default: 0 },
    latencyMs: { type: Number, required: true },
    isUp: { type: Boolean, required: true },
    error: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

checkSchema.index({ resourceId: 1, timestamp: -1 });
checkSchema.index({ userId: 1, timestamp: -1 });

// 30-day TTL
checkSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model("Check", checkSchema);
