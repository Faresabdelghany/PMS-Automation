import { supabase } from "@/lib/supabase"
import { agents as staticAgents, type Agent } from "@/lib/data/agents"

// ---------- DB row type ----------

type AgentLogRow = {
  id: string
  agent_name: string
  task_description: string
  model_used: string
  status: string
  created_at: string
  todo_id: string | null
  run_id: string | null
  event_type: string | null
  level: string | null
  error_message: string | null
  completed_at: string | null
}

type AgentConfigRow = {
  name: string
  ai_provider: string | null
  ai_model: string | null
}

// ---------- App type ----------

export type AgentLog = {
  id: string
  agentName: string
  taskDescription: string
  modelUsed: string
  status: "completed" | "failed" | "in_progress"
  createdAt: string
  todoId: string | null
  runId: string | null
  eventType: string | null
  level: string | null
  errorMessage: string | null
  completedAt: string | null
}

const PROVIDER_MAP: Record<string, string> = {
  anthropic: "anthropic",
  google: "google",
  openai: "openai",
  groq: "groq",
  mistral: "mistral",
  xai: "xai",
  deepseek: "deepseek",
  openrouter: "openrouter",
  "openai-codex": "openai-codex",
}

// ---------- Mapping ----------

function rowToLog(row: AgentLogRow): AgentLog {
  const status = row.status === "failed" ? "failed" : row.status === "in_progress" ? "in_progress" : "completed"
  return {
    id: row.id,
    agentName: row.agent_name,
    taskDescription: row.task_description,
    modelUsed: row.model_used,
    status,
    createdAt: row.created_at,
    todoId: row.todo_id,
    runId: row.run_id,
    eventType: row.event_type,
    level: row.level,
    errorMessage: row.error_message,
    completedAt: row.completed_at,
  }
}

function composeModelId(config: AgentConfigRow): string | null {
  if (!config.ai_model) return null
  if (config.ai_model.includes("/")) return config.ai_model

  const rawProvider = config.ai_provider || "anthropic"
  const provider = PROVIDER_MAP[rawProvider] || rawProvider
  return `${provider}/${config.ai_model}`
}

// ---------- Queries ----------

/** Fetch agent logs linked to a specific task */
export async function fetchAgentLogsByTask(todoId: string): Promise<AgentLog[]> {
  const { data, error } = await supabase
    .from("agent_logs")
    .select("*")
    .eq("todo_id", todoId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchAgentLogsByTask error:", error)
    return []
  }

  return (data as AgentLogRow[]).map(rowToLog)
}

/** Fetch agent logs linked to a specific run */
export async function fetchAgentLogsByRun(runId: string): Promise<AgentLog[]> {
  const { data, error } = await supabase
    .from("agent_logs")
    .select("*")
    .eq("run_id", runId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("fetchAgentLogsByRun error:", error)
    return []
  }

  return (data as AgentLogRow[]).map(rowToLog)
}

/** Fetch agent logs filtered by event type */
export async function fetchAgentLogsByEvent(eventType: string): Promise<AgentLog[]> {
  const { data, error } = await supabase
    .from("agent_logs")
    .select("*")
    .eq("event_type", eventType)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchAgentLogsByEvent error:", error)
    return []
  }

  return (data as AgentLogRow[]).map(rowToLog)
}

export async function fetchAgentLogs(limit = 50): Promise<AgentLog[]> {
  const { data, error } = await supabase
    .from("agent_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("fetchAgentLogs error:", error)
    return []
  }

  return (data as AgentLogRow[]).map(rowToLog)
}

export async function fetchAgentsWithActivity(): Promise<Agent[]> {
  const logs = await fetchAgentLogs(200)
  const { data: configRows, error: configError } = await supabase
    .from("agents")
    .select("name, ai_provider, ai_model")

  const taskCounts = new Map<string, number>()
  const lastActive = new Map<string, string>()
  const liveConfigs = new Map<string, AgentConfigRow>()

  for (const log of logs) {
    const current = taskCounts.get(log.agentName) ?? 0
    taskCounts.set(log.agentName, current + 1)

    if (!lastActive.has(log.agentName)) {
      lastActive.set(log.agentName, log.createdAt)
    }
  }

  if (!configError) {
    for (const row of (configRows as AgentConfigRow[]) || []) {
      liveConfigs.set(row.name, row)
    }
  } else {
    console.error("fetchAgentsWithActivity config error:", configError)
  }

  return staticAgents.map((agent) => ({
    ...agent,
    model: composeModelId(liveConfigs.get(agent.name) ?? { name: agent.name, ai_provider: agent.provider, ai_model: agent.model }) ?? agent.model,
    provider: liveConfigs.get(agent.name)?.ai_provider || agent.provider,
    taskCount: taskCounts.get(agent.name) ?? 0,
    lastActive: lastActive.get(agent.name),
  }))
}
