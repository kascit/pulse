import mongoose from "mongoose";
import Resource from "./Resource.js";
import crypto from "crypto";

const Heartbeat = Resource.discriminator(
  "Heartbeat",
  new mongoose.Schema({
    heartbeatToken: { type: String, unique: true, sparse: true, default: () => crypto.randomUUID() },
    graceMinutes: { type: Number, default: 5 },
    lastPingedAt: { type: Date, default: null },
  })
);

export default Heartbeat;
