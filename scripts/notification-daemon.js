#!/usr/bin/env node
// notification-daemon.js
// Polls agent_notifications every 2 seconds.
// For each undelivered row: fetches the agent's session_key, delivers via openclaw CLI,
// then marks it delivered.
//
// Usage: node notification-daemon.js
// Requires: Node.js 18+ (native fetch)

"use strict"

const { execSync } = require("child_process")
const { platform } = require("os")

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://lazhmdyajdqbnxxwyxun.supabase.co"
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhemhtZHlhamRxYm54eHd5eHVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTAzMzUzMCwiZXhwIjoyMDg0NjA5NTMwfQ.ynuJxkd-n6t162KfbHsaR-OVPBG-Ap65T_-VfCqN4ao"
const POLL_INTERVAL_MS = 2000

// On Windows, the CLI wrapper is openclaw.cmd; on other platforms, openclaw
const OPENCLAW_CMD = platform() === "win32" ? "openclaw.cmd" : "openclaw"

// ── Supabase helpers ─────────────────────────────────────────────────────────

const SUPABASE_HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
}

/**
 * Fetch all undelivered agent_notifications, joining the agent's name.
 */
async function fetchUndelivered() {
  const url =
    `${SUPABASE_URL}/rest/v1/agent_notifications` +
    `?delivered=eq.false` +
    `&select=id,content,mentioned_agent_id,agents!mentioned_agent_id(name)`

  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      // Override Prefer for selects (no return=minimal needed)
    },
  })
  if (!res.ok) {
    throw new Error(`fetchUndelivered failed: ${res.status} ${await res.text()}`)
  }
  return res.json()
}

/**
 * Mark a notification as delivered.
 */
async function markDelivered(notificationId) {
  const url = `${SUPABASE_URL}/rest/v1/agent_notifications?id=eq.${notificationId}`
  const res = await fetch(url, {
    method: "PATCH",
    headers: SUPABASE_HEADERS,
    body: JSON.stringify({ delivered: true }),
  })
  if (!res.ok) {
    throw new Error(`markDelivered failed: ${res.status}`)
  }
}

// ── Agent Name → OpenClaw Agent ID ───────────────────────────────────────────

const SUPABASE_NAME_TO_OPENCLAW_ID = {
  "Ziko": "main",
  "Product Analyst": "product-analyst",
  "Karim": "marketing",
  "Design Lead": "designer",
  "Dev": "dev",
  "Nabil": "main",
  "Omar": "dev",
  "Mostafa": "dev",
  "Sara": "dev",
}

// ── Delivery ──────────────────────────────────────────────────────────────────

/**
 * Send a message to an agent via the OpenClaw CLI.
 */
function sendToAgent(agentId, content) {
  const safeContent = content.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
  const cmd = `${OPENCLAW_CMD} agent --agent "${agentId}" --message "${safeContent}"`
  execSync(cmd, { stdio: "inherit", timeout: 60_000 })
}

// ── Poll loop ──────────────────────────────────────────────────────────────────

async function poll() {
  let notifications
  try {
    notifications = await fetchUndelivered()
  } catch (err) {
    console.error("[daemon] Poll fetch error:", err.message)
    return
  }

  if (!Array.isArray(notifications) || notifications.length === 0) return

  console.log(`[daemon] Found ${notifications.length} undelivered notification(s).`)

  for (const notif of notifications) {
    const agentName = notif.agents?.name ?? null
    const openclawId = agentName ? (SUPABASE_NAME_TO_OPENCLAW_ID[agentName] || "main") : "main"

    try {
      sendToAgent(openclawId, notif.content)
      await markDelivered(notif.id)
      console.log(`[daemon] ✓ Delivered notification ${notif.id} → ${openclawId} (${agentName || "unknown"})`)
    } catch (err) {
      console.error(`[daemon] ✗ Failed to deliver ${notif.id} → ${openclawId}:`, err.message)
    }
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────

console.log("[daemon] Notification daemon starting...")
console.log(`[daemon] Supabase: ${SUPABASE_URL}`)
console.log(`[daemon] Poll interval: ${POLL_INTERVAL_MS}ms`)
console.log(`[daemon] CLI command: ${OPENCLAW_CMD}`)
console.log("")

// Run immediately, then on interval
poll()
setInterval(poll, POLL_INTERVAL_MS)
