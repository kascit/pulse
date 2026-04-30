/**
 * Pulse API Integration Test Script
 * Run with: node test-api.js
 * Requires the server to be running on :5000
 */

import dotenv from "dotenv";
dotenv.config();

const BASE = `http://localhost:${process.env.PORT || 5000}/api`;
let token = "";
let userId = "";
const ids = {};

const clr = { green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m" };
let passed = 0, failed = 0;

function log(label, ok, detail = "") {
  if (ok) { passed++; console.log(`  ${clr.green}✓${clr.reset} ${label}`); }
  else { failed++; console.log(`  ${clr.red}✗${clr.reset} ${label}${detail ? ` — ${clr.red}${detail}${clr.reset}` : ""}`); }
}

async function req(method, path, body, authToken = token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

async function section(title, fn) {
  console.log(`\n${clr.bold}${title}${clr.reset}`);
  await fn();
}

// ── Main ────────────────────────────────────────────────────────────────────

const testEmail = `test_${Date.now()}@pulse.test`;
const testPassword = "testpass123";

await section("Health", async () => {
  const r = await req("GET", "/health");
  log("GET /health → 200", r.status === 200 && r.data?.status === "ok", JSON.stringify(r.data));
});

await section("Auth — Register", async () => {
  // Missing fields
  const r1 = await req("POST", "/auth/register", { email: testEmail }, "");
  log("Register with missing fields → 400", r1.status === 400);

  // Bad email
  const r2 = await req("POST", "/auth/register", { name: "Test", email: "notanemail", password: testPassword }, "");
  log("Register with bad email → 400", r2.status === 400);

  // Valid
  const r3 = await req("POST", "/auth/register", { name: "Test User", email: testEmail, password: testPassword }, "");
  log("Register valid → 201 + token", r3.status === 201 && !!r3.data?.token);
  if (r3.data?.token) { token = r3.data.token; userId = r3.data.user._id; }

  // Duplicate
  const r4 = await req("POST", "/auth/register", { name: "Test User", email: testEmail, password: testPassword }, "");
  log("Register duplicate email → 400", r4.status === 400);
});

await section("Auth — Login", async () => {
  const r1 = await req("POST", "/auth/login", { email: testEmail, password: "wrong" }, "");
  log("Login wrong password → 401", r1.status === 401);

  const r2 = await req("POST", "/auth/login", { email: testEmail, password: testPassword }, "");
  log("Login valid → 200 + token", r2.status === 200 && !!r2.data?.token);
  if (r2.data?.token) token = r2.data.token;
});

await section("Auth — Me", async () => {
  const r1 = await req("GET", "/auth/me", null, "");
  log("GET /me without token → 401", r1.status === 401);

  const r2 = await req("GET", "/auth/me");
  log("GET /me with token → 200", r2.status === 200 && r2.data?.email === testEmail);

  const r3 = await req("PATCH", "/auth/me", { name: "Updated Name" });
  log("PATCH /me name → 200", r3.status === 200 && r3.data?.name === "Updated Name");
});

await section("Monitors", async () => {
  // Create — bad URL
  const r1 = await req("POST", "/monitors", { name: "Test", url: "notaurl" });
  log("POST /monitors bad URL → 400", r1.status === 400);

  // Create valid
  const r2 = await req("POST", "/monitors", { name: "My API", url: "https://httpbin.org/get", intervalMinutes: 5 });
  log("POST /monitors valid → 201", r2.status === 201 && !!r2.data?._id);
  ids.monitor = r2.data?._id;

  // List
  const r3 = await req("GET", "/monitors");
  log("GET /monitors → 200 array", r3.status === 200 && Array.isArray(r3.data));
  log("GET /monitors contains created monitor", r3.data?.some((m) => m._id === ids.monitor));

  // Get
  const r4 = await req("GET", `/monitors/${ids.monitor}`);
  log("GET /monitors/:id → 200", r4.status === 200 && r4.data?._id === ids.monitor);

  // Get wrong id
  const r5 = await req("GET", "/monitors/000000000000000000000000");
  log("GET /monitors/:id not found → 404", r5.status === 404);

  // Update
  const r6 = await req("PUT", `/monitors/${ids.monitor}`, { name: "Updated API", url: "https://httpbin.org/get", intervalMinutes: 5 });
  log("PUT /monitors/:id → 200 updated name", r6.status === 200 && r6.data?.name === "Updated API");

  // Toggle
  const r7 = await req("PATCH", `/monitors/${ids.monitor}/toggle`);
  log("PATCH /monitors/:id/toggle → 200", r7.status === 200 && typeof r7.data?.isActive === "boolean");

  // Another user can't access
  const other = await req("GET", `/monitors/${ids.monitor}`, null, "fake.token.here");
  log("GET monitor with bad token → 401", other.status === 401);
});

await section("Heartbeats", async () => {
  const r1 = await req("POST", "/heartbeats", { name: "My Cron", graceMinutes: 5 });
  log("POST /heartbeats valid → 201", r1.status === 201 && !!r1.data?._id);
  ids.heartbeat = r1.data?._id;
  ids.heartbeatToken = r1.data?.heartbeatToken;

  const r2 = await req("GET", "/heartbeats");
  log("GET /heartbeats → 200 array", r2.status === 200 && Array.isArray(r2.data));

  const r3 = await req("GET", `/heartbeats/${ids.heartbeat}`);
  log("GET /heartbeats/:id → 200", r3.status === 200);

  const r4 = await req("PUT", `/heartbeats/${ids.heartbeat}`, { name: "Updated Cron", graceMinutes: 10 });
  log("PUT /heartbeats/:id → 200 updated", r4.status === 200 && r4.data?.graceMinutes === 10);

  // Public heartbeat ping
  const r5 = await req("POST", `/heartbeat/${ids.heartbeatToken}`, null, "");
  log("POST /heartbeat/:token (public) → 200", r5.status === 200 && r5.data?.ok === true);

  // Bad token
  const r6 = await req("POST", "/heartbeat/invalid-token-xyz", null, "");
  log("POST /heartbeat/:token bad token → 404", r6.status === 404);
});

await section("Stats", async () => {
  const r1 = await req("GET", `/stats/${ids.heartbeat}`);
  log("GET /stats/:id → 200", r1.status === 200 && typeof r1.data?.uptime === "number");
  log("Stats has hourlyBuckets", Array.isArray(r1.data?.hourlyBuckets));
  log("Stats has recentChecks", Array.isArray(r1.data?.recentChecks));
  log("Stats has reliability", typeof r1.data?.reliability === "object");

  const r2 = await req("GET", `/stats/000000000000000000000000`);
  log("GET /stats/:id not found → 404", r2.status === 404);
});

await section("Alert Channels", async () => {
  // Bad type
  const r1 = await req("POST", "/alerts/channels", { name: "Bad", type: "email", config: { url: "https://x.com" } });
  log("POST /alerts/channels bad type → 400", r1.status === 400);

  // Webhook — missing url in config
  const r2 = await req("POST", "/alerts/channels", { name: "Hook", type: "webhook", config: {} });
  log("POST /alerts/channels webhook no url → 400", r2.status === 400);

  // Webhook valid
  const r3 = await req("POST", "/alerts/channels", { name: "Test Hook", type: "webhook", config: { url: "https://example.com/hook" } });
  log("POST /alerts/channels webhook valid → 201", r3.status === 201 && !!r3.data?._id);
  ids.channel = r3.data?._id;

  const r4 = await req("GET", "/alerts/channels");
  log("GET /alerts/channels → 200 array", r4.status === 200 && Array.isArray(r4.data));

  const r5 = await req("GET", `/alerts/channels/${ids.channel}`);
  log("GET /alerts/channels/:id → 200", r5.status === 200);

  const r6 = await req("PUT", `/alerts/channels/${ids.channel}`, { name: "Updated Hook", type: "webhook", config: { url: "https://example.com/hook2" } });
  log("PUT /alerts/channels/:id → 200 updated", r6.status === 200 && r6.data?.name === "Updated Hook");
});

await section("Alert Rules", async () => {
  // No channels
  const r1 = await req("POST", "/alerts/rules", { name: "Rule", channelIds: [], resources: [ids.monitor] });
  log("POST /alerts/rules no channels → 400", r1.status === 400);

  // Valid
  const r2 = await req("POST", "/alerts/rules", { name: "Test Rule", channelIds: [ids.channel], resources: [ids.monitor], triggers: { latencyMs: null } });
  log("POST /alerts/rules valid → 201", r2.status === 201 && !!r2.data?._id);
  ids.rule = r2.data?._id;

  const r3 = await req("GET", "/alerts/rules");
  log("GET /alerts/rules → 200 array", r3.status === 200 && Array.isArray(r3.data));

  const r4 = await req("GET", `/alerts/rules/${ids.rule}`);
  log("GET /alerts/rules/:id → 200 with populated channels", r4.status === 200 && !!r4.data?._id);

  const r5 = await req("PUT", `/alerts/rules/${ids.rule}`, { name: "Updated Rule", channelIds: [ids.channel], resources: [ids.monitor], enabled: false });
  log("PUT /alerts/rules/:id → 200 updated", r5.status === 200 && r5.data?.name === "Updated Rule");
  log("PUT /alerts/rules/:id enabled=false", r5.data?.enabled === false);
});

await section("Status Pages", async () => {
  // Slug collision check
  const slug = `test-${Date.now()}`;
  const r1 = await req("POST", "/status-pages", { name: "Test Status", slug, description: "desc", resources: [ids.monitor] });
  log("POST /status-pages valid → 201", r1.status === 201 && !!r1.data?._id);
  ids.statusPage = r1.data?._id;

  // Duplicate slug
  const r2 = await req("POST", "/status-pages", { name: "Another", slug, description: "", resources: [] });
  log("POST /status-pages duplicate slug → 409", r2.status === 409);

  const r3 = await req("GET", "/status-pages");
  log("GET /status-pages → 200 array", r3.status === 200 && Array.isArray(r3.data));

  const r4 = await req("GET", `/status-pages/${ids.statusPage}`);
  log("GET /status-pages/:id → 200 populated resources", r4.status === 200 && Array.isArray(r4.data?.resources));

  const r5 = await req("PUT", `/status-pages/${ids.statusPage}`, { name: "Updated Status", slug, resources: [ids.monitor], isPaused: true });
  log("PUT /status-pages/:id pause → 200", r5.status === 200 && r5.data?.isPaused === true);
  log("Resources preserved after pause", r5.data?.resources?.length > 0);

  // Public endpoint
  const r6 = await req("GET", `/public/${slug}`, null, "");
  log("GET /public/:slug (paused page) → 200 isPaused", r6.status === 200 && r6.data?.isPaused === true);

  // Resume + check public
  await req("PUT", `/status-pages/${ids.statusPage}`, { name: "Updated Status", slug, resources: [ids.monitor], isPaused: false });
  const r7 = await req("GET", `/public/${slug}`, null, "");
  log("GET /public/:slug (active) → 200 with resources", r7.status === 200 && Array.isArray(r7.data?.resources));

  // Not found
  const r8 = await req("GET", "/public/slug-that-does-not-exist-ever", null, "");
  log("GET /public/:slug not found → 404", r8.status === 404);
});

await section("Logs", async () => {
  const r1 = await req("GET", "/logs");
  log("GET /logs → 200 with total", r1.status === 200 && typeof r1.data?.total === "number");
  log("GET /logs has logs array", Array.isArray(r1.data?.logs));

  const r2 = await req("GET", "/logs?limit=5&page=1");
  log("GET /logs pagination works", r2.status === 200 && r2.data?.limit === 5);

  const r3 = await req("GET", "/logs?event=resource.created");
  log("GET /logs ?event filter → 200", r3.status === 200);

  if (r1.data?.logs?.length > 0) {
    const logId = r1.data.logs[0]._id;
    const r4 = await req("GET", `/logs/${logId}`);
    log("GET /logs/:id → 200", r4.status === 200 && r4.data?._id === logId);
  }

  const r5 = await req("GET", "/logs/000000000000000000000000");
  log("GET /logs/:id not found → 404", r5.status === 404);
});

await section("Cleanup — Delete", async () => {
  const r1 = await req("DELETE", `/alerts/rules/${ids.rule}`);
  log("DELETE /alerts/rules/:id → 200", r1.status === 200);

  const r2 = await req("DELETE", `/alerts/channels/${ids.channel}`);
  log("DELETE /alerts/channels/:id → 200", r2.status === 200);

  const r3 = await req("DELETE", `/status-pages/${ids.statusPage}`);
  log("DELETE /status-pages/:id → 200", r3.status === 200);

  const r4 = await req("DELETE", `/monitors/${ids.monitor}`);
  log("DELETE /monitors/:id → 200", r4.status === 200);

  const r5 = await req("GET", `/monitors/${ids.monitor}`);
  log("GET deleted monitor → 404", r5.status === 404);

  const r6 = await req("DELETE", `/heartbeats/${ids.heartbeat}`);
  log("DELETE /heartbeats/:id → 200", r6.status === 200);
});

await section("Auth — Delete Account", async () => {
  // Wrong password
  const r1 = await req("DELETE", "/auth/me", { password: "wrongpassword" });
  log("DELETE /auth/me wrong password → 400", r1.status === 400);

  const r2 = await req("DELETE", "/auth/me", { password: testPassword });
  log("DELETE /auth/me correct password → 200", r2.status === 200);

  // Token no longer valid
  const r3 = await req("GET", "/auth/me");
  log("GET /me after delete → 401", r3.status === 401);
});

// ── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${clr.bold}━━━ Results ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${clr.reset}`);
console.log(`  ${clr.green}Passed: ${passed}${clr.reset}`);
if (failed > 0) console.log(`  ${clr.red}Failed: ${failed}${clr.reset}`);
else console.log(`  ${clr.dim}Failed: 0${clr.reset}`);
console.log(`  Total:  ${passed + failed}`);
if (failed === 0) console.log(`\n  ${clr.green}${clr.bold}All tests passed! ✓${clr.reset}`);
else console.log(`\n  ${clr.red}${failed} test(s) failed.${clr.reset}`);
process.exit(failed > 0 ? 1 : 0);
