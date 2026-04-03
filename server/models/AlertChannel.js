import mongoose from "mongoose";

const alertChannelSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ["webhook", "telegram"], required: true },
  config: { type: mongoose.Schema.Types.Mixed, required: true },
  enabled: { type: Boolean, default: true },
  tags: { type: [String], default: [] },
}, { timestamps: true });

export default mongoose.model("AlertChannel", alertChannelSchema);
