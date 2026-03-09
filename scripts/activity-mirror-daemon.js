#!/usr/bin/env node
"use strict"

// activity-mirror-daemon.js
// Mirrors OpenClaw runtime activity into PMS /api/agent-events automatically.
// Event types emitted: task_started, task_progress, task_completed, task_failed, agent_message

const fs = require("fs")
const path = require("path")
const { spawn } = require("child_process")

const ROOT = path.resolve(__dirname, "..")
const PUSH_SCRIPT = path.join(__dirname, "push-event.ps1")
const STATE_PATH = path.join(ROOT, ".pi", "activity-mirror-state.json")
const LOG_PATH = path.join(__dirname, "activity-mirror.log")
const ERR_PATH = path.join(__dirname, "activity-mirror-err.log")

const POLL_SESSION_MAP_MS = 60_000
const MAX_SEEN = 5000

const args = new Set(process.argv.slice(2))
const DRY_RUN = args.has("--dry-run")
const ONCE = args.has("--once")
const LIMIT = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] || "200")

const AGENT_UUID = {
  main: "a2776ed4-b6a6-4465-b060-664d3a99be55",
  "product-analyst": "1f483d60-8c25-448a-8215-207c5787fd7e",
  marketing: "371279bf-1c6f-4527-87c3-bcf04d7d8b05",
  "marketing-agent": "371279bf-1c6f-4527-87c3-bcf04d7d8b05",
  designer: "955cc174-4ebe-4fb8-b5c4-bf404e21bfe1",
  dev: "fb92236d-8d7e-4471-b490-a04652d624f5",
  reviewer: "fb92236d-8d7e-4471-b490-a04652d624f5",
  tester: "fb92236d-8d7e-4471-b490-a04652d624f5",

  // aliases
  "code-reviewer": "fb92236d-8d7e-4471-b490-a04652d624f5",
  "tech-lead": "ba6990f4-674c-499e-96f5-8610378ace63",
  "marketing-lead": "371279bf-1c6f-4527-87c3-bcf04d7d8b05",
  "design-lead": "955cc174-4ebe-4fb8-b5c4-bf404e21bfe1",
  nabil: "f2e54318-0dcb-4306-87e4-77016efaa6bb",
}

const state = loadState()
const runToAgent = new Map(state.runToAgent || [])
const runToolCount = new Map(state.runToolCount || [])
const seen = new Set(state.seenKeys || [])
const sessionIdToKey = new Map()

let pushQueue = Promise.resolve()

function nowIso() {
  return new Date().toISOString()
}

function append(file, line) {
  fs.appendFileSync(file, `${nowIso()} ${line}\n`, "utf8")
}

function loadState() {
  try {
    if (!fs.existsSync(STATE_PATH)) return {}
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"))
  } catch {
    return {}
  }
}

function saveState() {
  const seenArr = [...seen]
  const trimmedSeen = seenArr.slice(Math.max(0, seenArr.length - MAX_SEEN))
  const obj = {
    updatedAt: Date.now(),
    seenKeys: trimmedSeen,
    runToAgent: [...runToAgent.entries()].slice(-1000),
    runToolCount: [...runToolCount.entries()].slice(-1000),
  }
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true })
  fs.writeFileSync(STATE_PATH, JSON.stringify(obj, null, 2), "utf8")
}

function normalizeAgentSlug(sessionKey) {
  if (!sessionKey) return null
  const m = sessionKey.match(/^agent:([^:]+)/)
  if (!m) return null
  const raw = m[1]
  const aliases = {
    ziko: "main",
    "product-analyst": "product-analyst",
    marketing: "marketing-agent",
    "marketing-agent": "marketing-agent",
    designer: "designer",
    dev: "dev",
    reviewer: "reviewer",
    "code-reviewer": "reviewer",
  }
  return aliases[raw] || raw
}

function displayAgent(slug) {
  if (!slug) return "Unknown agent"
  const names = {
    main: "Ziko",
    "product-analyst": "Product Analyst",
    "marketing-agent": "Marketing Agent",
    designer: "Designer",
    dev: "Dev",
    reviewer: "Code Reviewer",
  }
  return names[slug] || slug
}

async function refreshSessionMap() {
  try {
    const agentsRoot = path.join("C:\\Users\\Fares\\.openclaw", "agents")
    if (!fs.existsSync(agentsRoot)) return

    const dirs = fs.readdirSync(agentsRoot, { withFileTypes: true }).filter((d) => d.isDirectory())
    for (const d of dirs) {
      const file = path.join(agentsRoot, d.name, "sessions", "sessions.json")
      if (!fs.existsSync(file)) continue
      try {
        const json = JSON.parse(fs.readFileSync(file, "utf8"))
        for (const key of Object.keys(json || {})) {
          const entry = json[key]
          const sid = entry?.sessionId || entry?.id
          if (sid) sessionIdToKey.set(sid, key)
        }
      } catch (e) {
        append(ERR_PATH, `[map] failed to parse ${file}: ${e.message}`)
      }
    }
  } catch (e) {
    append(ERR_PATH, `[map] refresh error: ${e.message}`)
  }
}

function queuePush(evt) {
  pushQueue = pushQueue.then(() => pushEventWithRetry(evt)).catch((e) => append(ERR_PATH, `[queue] ${e.message}`))
}

async function pushEventWithRetry(evt) {
  const key = evt.key
  if (!key || seen.has(key)) return
  seen.add(key)

  const slug = evt.agentSlug
  let agentId = slug ? AGENT_UUID[slug] : undefined

  // Fallback: never drop activity events. Route unmapped events to Ziko.
  if (!agentId) {
    agentId = AGENT_UUID.main
    append(LOG_PATH, `[fallback] unmapped slug=${slug || "unknown"} type=${evt.type} -> main`)
  }

  if (DRY_RUN) {
    append(LOG_PATH, `[dry-run] ${evt.type} ${slug} :: ${evt.message}`)
    return
  }

  const safeMessage = evt.message.replace(/"/g, '\\"')
  const args = [
    "-ExecutionPolicy", "Bypass",
    "-File", PUSH_SCRIPT,
    "-EventType", evt.type,
    "-Message", safeMessage,
    "-AgentId", agentId,
  ]

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const p = spawn("powershell", args, { stdio: ["ignore", "pipe", "pipe"] })
        let err = ""
        p.stderr.on("data", (d) => (err += d.toString()))
        p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit=${code} ${err.trim()}`))))
      })
      append(LOG_PATH, `[push-ok] ${evt.type} ${slug} ${evt.runId || ""}`)
      return
    } catch (e) {
      append(ERR_PATH, `[push-fail] attempt=${attempt} type=${evt.type} run=${evt.runId || ""} err=${e.message}`)
      await new Promise((r) => setTimeout(r, 500 * attempt))
    }
  }
}

function parseLogLine(obj) {
  if (!obj || obj.type !== "log") return null
  const text = obj.message || ""
  const raw = obj.raw || ""

  let m
  m = text.match(/embedded run start: runId=([^\s]+) sessionId=([^\s]+) .*messageChannel=([^\s]+)/)
  if (m) {
    const [, runId, sessionId, channel] = m
    const sessionKey = sessionIdToKey.get(sessionId)
    const slug = normalizeAgentSlug(sessionKey)
    runToAgent.set(runId, slug)
    runToolCount.set(runId, 0)
    return {
      type: "task_started",
      runId,
      agentSlug: slug,
      key: `task_started|${runId}`,
      message: `${displayAgent(slug)}: run started via ${channel}`,
    }
  }

  m = text.match(/embedded run tool start: runId=([^\s]+) tool=([^\s]+)/)
  if (m) {
    const [, runId, tool] = m
    const slug = runToAgent.get(runId)
    const c = (runToolCount.get(runId) || 0) + 1
    runToolCount.set(runId, c)
    if (c === 1 || c % 5 === 0) {
      return {
        type: "task_progress",
        runId,
        agentSlug: slug,
        key: `task_progress|${runId}|${c}`,
        message: `${displayAgent(slug)}: progress checkpoint (tool=${tool}, step=${c})`,
      }
    }
    return null
  }

  m = text.match(/embedded run done: runId=([^\s]+) sessionId=([^\s]+) .*aborted=(true|false)/)
  if (m) {
    const [, runId, sessionId, aborted] = m
    const slug = runToAgent.get(runId) || normalizeAgentSlug(sessionIdToKey.get(sessionId))
    return {
      type: aborted === "true" ? "task_failed" : "task_completed",
      runId,
      agentSlug: slug,
      key: `${aborted === "true" ? "task_failed" : "task_completed"}|${runId}`,
      message: `${displayAgent(slug)}: run ${aborted === "true" ? "aborted" : "completed"} (${runToolCount.get(runId) || 0} steps)`,
    }
  }

  m = text.match(/embedded run agent end: runId=([^\s]+) isError=true error=(.+)$/)
  if (m) {
    const [, runId, err] = m
    const slug = runToAgent.get(runId)
    return {
      type: "task_failed",
      runId,
      agentSlug: slug,
      key: `task_failed|${runId}|agent_end`,
      message: `${displayAgent(slug)}: run failed — ${err.slice(0, 180)}`,
    }
  }

  m = text.match(/embedded run prompt end: runId=([^\s]+) sessionId=([^\s]+) durationMs=(\d+)/)
  if (m) {
    const [, runId, sessionId, duration] = m
    const slug = runToAgent.get(runId) || normalizeAgentSlug(sessionIdToKey.get(sessionId))
    return {
      type: "agent_message",
      runId,
      agentSlug: slug,
      key: `agent_message|${runId}`,
      message: `${displayAgent(slug)}: prompt cycle finished (${Math.round(Number(duration) / 1000)}s)`,
    }
  }

  // fallback for session lane activity (useful for subagents if session map is stale)
  m = text.match(/lane enqueue: lane=(session:agent:([^:\s]+):[^\s]+) queueSize=/)
  if (m) {
    const [, lane, slugRaw] = m
    const slug = normalizeAgentSlug(`agent:${slugRaw}:x`) || slugRaw
    return {
      type: "task_progress",
      runId: lane,
      agentSlug: slug,
      key: `lane_progress|${obj.time}|${lane}`,
      message: `${displayAgent(slug)}: queued activity (${lane})`,
    }
  }

  if (raw.includes("telegram sendMessage ok")) {
    return {
      type: "agent_message",
      runId: obj.time,
      agentSlug: "main",
      key: `telegram_message|${obj.time}`,
      message: `Ziko: outbound telegram message sent`,
    }
  }

  return null
}

function handleParsed(jsonLine) {
  let obj
  try {
    obj = JSON.parse(jsonLine)
  } catch {
    return
  }
  const evt = parseLogLine(obj)
  if (!evt) return
  queuePush(evt)
}

function startFollow() {
  append(LOG_PATH, `[boot] activity mirror daemon starting dryRun=${DRY_RUN}`)

  const child = spawn("openclaw.cmd", ["logs", "--json", "--follow", "--plain", "--interval", "1000"], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  })

  let buf = ""
  child.stdout.on("data", (chunk) => {
    buf += chunk.toString()
    let idx
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim()
      buf = buf.slice(idx + 1)
      if (line) handleParsed(line)
    }
  })

  child.stderr.on("data", (d) => append(ERR_PATH, `[openclaw logs] ${d.toString().trim()}`))

  child.on("close", (code) => {
    append(ERR_PATH, `[daemon] openclaw logs process exited code=${code}; restarting in 3s`)
    setTimeout(startFollow, 3000)
  })
}

async function runOnce() {
  append(LOG_PATH, `[once] parsing ${LIMIT} lines dryRun=${DRY_RUN}`)
  const child = spawn("openclaw.cmd", ["logs", "--json", "--plain", "--limit", String(LIMIT), "--timeout", "5000"], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  })

  let out = ""
  child.stdout.on("data", (d) => (out += d.toString()))
  child.stderr.on("data", (d) => append(ERR_PATH, `[once] ${d.toString().trim()}`))
  await new Promise((resolve) => child.on("close", resolve))

  for (const line of out.split(/\r?\n/)) {
    const t = line.trim()
    if (t) handleParsed(t)
  }
  await pushQueue
  saveState()
}

async function main() {
  await refreshSessionMap()

  process.on("SIGINT", () => { saveState(); process.exit(0) })
  process.on("SIGTERM", () => { saveState(); process.exit(0) })
  process.on("uncaughtException", (e) => append(ERR_PATH, `[uncaught] ${e.stack || e.message}`))

  if (ONCE) {
    await runOnce()
    process.exit(0)
  }

  setInterval(refreshSessionMap, POLL_SESSION_MAP_MS)
  setInterval(saveState, 15_000)
  startFollow()
}

main().catch((e) => {
  append(ERR_PATH, `[fatal] ${e.stack || e.message}`)
  process.exit(1)
})
