import mongoose from "mongoose";

const statusPageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  description: { type: String, default: "" },
  resources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }],
  isPaused: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("StatusPage", statusPageSchema);
