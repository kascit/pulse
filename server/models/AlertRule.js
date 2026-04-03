import mongoose from "mongoose";

const alertRuleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true },
  channelIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "AlertChannel" }],
  resources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }],
  triggers: {
    latencyMs: { type: Number, default: null }, // null = disabled
  },
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("AlertRule", alertRuleSchema);
