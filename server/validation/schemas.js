import { z } from "zod";

const NAME_RULES = z
  .string()
  .min(2)
  .max(50)
  .regex(
    /^[\w\s'-]+$/,
    "Name can only contain letters, numbers, spaces, hyphens, and apostrophes",
  );
const PASSWORD_RULES = z
  .string()
  .min(6, "Password must be at least 6 characters");

export const registerSchema = z.object({
  name: NAME_RULES,
  email: z.string().email(),
  password: PASSWORD_RULES,
});
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export const updateMeSchema = z
  .object({
    name: NAME_RULES.optional(),
    email: z.string().email().optional(),
    currentPassword: z.string().optional(),
    newPassword: PASSWORD_RULES.optional(),
  })
  .refine((d) => !d.newPassword || !!d.currentPassword, {
    message: "Current password required",
    path: ["currentPassword"],
  });

export const monitorSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "HEAD"]).default("GET"),
  intervalMinutes: z
    .number()
    .int()
    .refine((v) => [1, 5, 15, 30, 60].includes(v), {
      message: "Interval must be 1, 5, 15, 30, or 60",
    })
    .default(5),
  expectedKeyword: z.string().optional().nullable(),
  headers: z.record(z.string()).optional().nullable(),
  body: z.string().optional().nullable(),
  isPaused: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export const heartbeatSchema = z.object({
  name: z.string().min(1),
  graceMinutes: z.number().int().min(1).max(1440).default(5),
  isPaused: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export const channelSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["webhook", "telegram"]),
  config: z.record(z.string(), z.string()),
  enabled: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
}).superRefine((val, ctx) => {
  if (val.type === "webhook" && !val.config?.url) {
    ctx.addIssue({ code: "custom", path: ["config", "url"], message: "Webhook URL is required" });
  }
  if (val.type === "telegram" && !val.config?.botToken) {
    ctx.addIssue({ code: "custom", path: ["config", "botToken"], message: "Bot token is required" });
  }
  if (val.type === "telegram" && !val.config?.chatId) {
    ctx.addIssue({ code: "custom", path: ["config", "chatId"], message: "Chat ID is required" });
  }
});

export const ruleSchema = z.object({
  name: z.string().min(1),
  channelIds: z.array(z.string()).min(1),
  resources: z.array(z.string()).min(1),
  triggers: z
    .object({ latencyMs: z.number().nullable().default(null) })
    .default({ latencyMs: null }),
  enabled: z.boolean().default(true),
});

export const statusPageSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().default(""),
  resources: z.array(z.string()).default([]),
  isPaused: z.boolean().default(false),
});
