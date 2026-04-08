import AlertRule from "../models/AlertRule.js";
import AlertChannel from "../models/AlertChannel.js";
import { record } from "./logService.js";

export const evaluate = async (resource, checkResult) => {
  try {
    const { isUp, prevStatus, latencyMs } = checkResult;
    const wasDown = prevStatus === "down";
    const isNewOutage = !isUp && !wasDown;
    const isRecovery  = isUp  && wasDown;
    const isLatency   = isUp  && !isNewOutage && !isRecovery;

    if (!isNewOutage && !isRecovery && !isLatency) return;

    const rules = await AlertRule.find({ resources: resource._id, enabled: true });

    for (const rule of rules) {
      if (!shouldFire(rule.triggers, { isNewOutage, isRecovery, latencyMs })) continue;

      const event = isRecovery ? "recovery" : isNewOutage ? "down" : "latency";
      const firedChannelIds = [];
      const firedChannelNames = [];

      for (const channelId of rule.channelIds) {
        const channel = await AlertChannel.findById(channelId);
        if (!channel || !channel.enabled) continue;
        await deliver(channel, resource, { ...checkResult, event });
        firedChannelIds.push(channel._id);
        firedChannelNames.push(`${channel.name} (${channel.type})`);
      }

      if (firedChannelIds.length === 0) continue;

      // Single log entry per rule fire, listing all channels in metadata
      await record(
        resource.userId,
        resource,
        "alert.fired",
        `Alert "${rule.name}" fired for ${resource.name} [${event}] via ${firedChannelNames.join(", ")}`,
        { ruleId: rule._id, channelIds: firedChannelIds, event, latencyMs }
      );
    }
  } catch (err) {
    console.error("[alertService] Evaluation error:", err.message);
  }
};

const shouldFire = (triggers, { isNewOutage, isRecovery, latencyMs }) => {
  if (isNewOutage || isRecovery) return true;
  if (triggers.latencyMs != null && latencyMs >= triggers.latencyMs) return true;
  return false;
};

const deliver = async (channel, resource, checkResult) => {
  const payload = {
    resource: resource.name,
    resourceType: resource.resourceType,
    status: checkResult.isUp ? "up" : "down",
    event: checkResult.event,
    latencyMs: checkResult.latencyMs,
    statusCode: checkResult.statusCode,
    error: checkResult.error,
    timestamp: new Date().toISOString(),
  };

  try {
    switch (channel.type) {
      case "webhook":
        await deliverWebhook(channel.config.url, payload);
        break;
      case "telegram":
        await deliverTelegram(channel.config.botToken, channel.config.chatId, payload);
        break;
    }
  } catch (err) {
    console.error(`[alertService] Delivery failed (${channel.type}):`, err.message);
  }
};

const deliverWebhook = async (url, payload) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
};

const deliverTelegram = async (botToken, chatId, payload) => {
  const statusEmoji = payload.event === "recovery" ? "✅" : payload.event === "down" ? "🔴" : "⚠️";
  const text = [
    `${statusEmoji} *Pulse Alert — ${payload.event.toUpperCase()}*`,
    `*Resource:* ${payload.resource} (${payload.resourceType})`,
    `*Status:* ${payload.status}`,
    payload.latencyMs != null ? `*Latency:* ${payload.latencyMs}ms` : null,
    payload.error ? `*Error:* ${payload.error}` : null,
    `*Time:* ${new Date(payload.timestamp).toLocaleString()}`,
  ].filter(Boolean).join("\n");

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Telegram API error: ${err.description ?? res.status}`);
  }
};

