import { AppError, ValidationError } from "./AppError.js";

export const errorHandler = (err, req, res, next) => {
  // ── Handled / expected errors (no stack trace needed) ─────────────────────
  if (err.code === 11000) {
    return res
      .status(409)
      .json({ error: "Duplicate entry", field: Object.keys(err.keyValue)[0] });
  }
  if (err.code === "JWT_EXPIRED") {
    return res.status(401).json({ error: "Token expired" });
  }
  if (err.code === "ERR_JWS_INVALID" || err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token" });
  }
  if (err instanceof ValidationError) {
    return res
      .status(err.statusCode)
      .json({ error: err.message, details: err.details });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  if (err.name === "ZodError") {
    // Zod v4 uses .issues; v3 used .errors — support both
    const issues = err.issues ?? err.errors ?? [];
    const message = issues.map((e) => e.message).join(", ");
    return res.status(400).json({ error: message, details: issues });
  }

  // ── Unexpected server errors — log with full stack ─────────────────────────
  console.error("[Server Error]", err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
};

export const notFoundHandler = (req, res) =>
  res.status(404).json({ error: "Route not found" });

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
