import mongoose from "mongoose";
import Resource from "./Resource.js";

const Monitor = Resource.discriminator(
  "Monitor",
  new mongoose.Schema({
    url: { type: String, required: true, trim: true },
    method: { type: String, enum: ["GET", "POST", "PUT", "DELETE", "HEAD"], default: "GET" },
    intervalMinutes: { type: Number, enum: [1, 5, 15, 30, 60], default: 5 },
    expectedKeyword: { type: String, default: null },
    headers: { type: mongoose.Schema.Types.Mixed, default: null },
    body: { type: String, default: null },
    sslExpiryDate: { type: Date, default: null },
  })
);

export default Monitor;
