#!/usr/bin/env node
// sync-daemon.js — Polling-based PMS → openclaw.json sync (every 10s)
// Reliable fallback since Supabase Realtime + RLS blocks service role events.

"use strict"

const { execSync } = require("child_process")
const fs = require("fs")

const SUPABASE_URL   = "https://lazhmdyajdqbnxxwyxun.supabase.co"
const SERVICE_KEY    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhemhtZHlhamRxYm54eHd5eHVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTAzMzUzMCwiZXhwIjoyMDg0NjA5NTMwfQ.ynuJxkd-n6t162KfbHsaR-OVPBG-Ap65T_-VfCqN4ao"
const ORG_ID         = "9c52b861-abb7-4774-9b5b-3fa55c8392cb"
const CONFIG_PATH    = "C:\\Users\\Fares\\.openclaw\\openclaw.json"
const PUSH_SCRIPT    = "C:\\Users\\Fares\\.openclaw\\workspace\\scripts\\push-event.ps1"
const ZIKO_UUID      = "a2776ed4-b6a6-4465-b060-664d3a99be55"
const POLL_INTERVAL  = 10000 // 10 seconds

const NAME_TO_ID = {
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

// Cache last known full model per agent to avoid unnecessary writes
const lastKnown = {}

async function fetchAgents() {
  const url = `${SUPABASE_URL}/rest/v1/agents?organization_id=eq.${ORG_ID}&select=name,ai_provider,ai_model`
  const res = await fetch(url, {
    headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return res.json()
}

function syncChanges(agents) {
  const raw    = fs.readFileSync(CONFIG_PATH, "utf8")
  const config = JSON.parse(raw)
  let changed  = false
  const changes = []

  for (const agent of agents) {
    const ocId = NAME_TO_ID[agent.name]
    if (!ocId || !agent.ai_model) continue

    const provider  = agent.ai_provider || "anthropic"
    const fullModel = `${provider}/${agent.ai_model}`

    // Skip if same as last poll
    if (lastKnown[agent.name] === fullModel) continue
    lastKnown[agent.name] = fullModel

    const entry = config.agents.list.find(a => a.id === ocId)
    if (!entry) continue
    if (entry.model === fullModel) continue

    console.log(`[sync] ${agent.name}: ${entry.model} -> ${fullModel}`)
    changes.push(`${agent.name} -> ${fullModel}`)
    entry.model = fullModel
    changed = true
  }

  if (changed) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8")
    console.log("[sync] openclaw.json updated — restarting gateway...")

    try {
      execSync(
        `powershell -ExecutionPolicy Bypass -File "${PUSH_SCRIPT}" -EventType "status_change" -Message "Ziko: PMS sync applied -- ${changes.join(', ')}" -AgentId "${ZIKO_UUID}"`,
        { stdio: "inherit" }
      )
    } catch (_) {}

    try {
      execSync("cmd /c openclaw gateway restart", { stdio: "inherit" })
      console.log("[sync] Gateway restarted.")
    } catch (e) {
      console.error("[sync] Gateway restart failed:", e.message)
    }
  }
}

async function poll() {
  try {
    const agents = await fetchAgents()
    syncChanges(agents)
  } catch (e) {
    console.error("[sync] Poll error:", e.message)
  }
}

console.log("[sync] PMS Config Sync Daemon starting (polling every 10s)...")
poll().then(() => setInterval(poll, POLL_INTERVAL))

