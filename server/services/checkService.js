import https from "https";
import http from "http";
import { URL } from "url";
import Check from "../models/Check.js";
import { record } from "./logService.js";
import { evaluate } from "./alertService.js";

/**
 * Perform an HTTP check on a monitor resource.
 * Writes a Check record, logs status changes, evaluates alerts.
 */
export const runCheck = async (monitor) => {
  const start = Date.now();
  let statusCode = 0;
  let isUp = false;
  let error = null;

  try {
    const result = await fetchWithTimeout(monitor.url, {
      method: monitor.method || "GET",
      headers: monitor.headers || {},
      body: ["POST", "PUT", "PATCH"].includes(monitor.method)
        ? monitor.body
        : undefined,
      timeout: 30000,
    });

    statusCode = result.statusCode;
    isUp = statusCode >= 200 && statusCode < 400;

    // Keyword check
    if (isUp && monitor.expectedKeyword) {
      if (!result.body.includes(monitor.expectedKeyword)) {
        isUp = false;
        error = `Expected keyword "${monitor.expectedKeyword}" not found`;
      }
    }

    // SSL expiry tracking
    if (result.sslExpiry) {
      monitor.sslExpiryDate = result.sslExpiry;
      await monitor.save();
    }
  } catch (err) {
    error = err.message;
    isUp = false;
  }

  const latencyMs = Date.now() - start;

  // Write check record
  const check = await Check.create({
    resourceId: monitor._id,
    userId: monitor.userId,
    statusCode,
    latencyMs,
    isUp,
    error,
    timestamp: new Date(),
  });

  // Update resource status
  const prevStatus = monitor.lastStatus;
  const newStatus = isUp ? "up" : "down";

  if (prevStatus !== newStatus) {
    monitor.lastStatus = newStatus;
    monitor.lastCheckedAt = new Date();
    await monitor.save();

    await record(
      monitor.userId,
      monitor,
      newStatus === "down" ? "resource.down" : "resource.up",
      `${monitor.name} is ${newStatus}`,
      { statusCode, latencyMs, error },
    );
  } else {
    monitor.lastCheckedAt = new Date();
    await monitor.save();
  }

  await evaluate(monitor, { isUp, statusCode, latencyMs, error, prevStatus });

  return check;
};

const fetchWithTimeout = (url, { method, headers, body, timeout }) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === "https:";
    const lib = isHttps ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method || "GET",
      headers: {
        "User-Agent": "Pulse-Monitor/1.0",
        ...(headers || {}),
        ...(body
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(body),
            }
          : {}),
      },
    };

    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let sslExpiry = null;
        if (isHttps && res.socket?.getPeerCertificate) {
          const cert = res.socket.getPeerCertificate();
          if (cert?.valid_to) sslExpiry = new Date(cert.valid_to);
        }
        resolve({ statusCode: res.statusCode, body: data, sslExpiry });
      });
    });

    req.on("error", reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });

    if (body) req.write(body);
    req.end();
  });
};
