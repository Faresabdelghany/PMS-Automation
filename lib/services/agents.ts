import { supabase } from "@/lib/supabase"
import { agents as staticAgents, type Agent } from "@/lib/data/agents"

type AgentLogRow = {
  id: string
  agent_name: string
  task_description: string
  model_used: string
  status: string
  created_at: string
  todo_id: string | null
}

export type AgentLog = {
  id: string
  agentName: string
  taskDescription: string
  modelUsed: string
  status: "completed" | "failed"
  createdAt: string
  todoId: string | null
}

function rowToLog(row: AgentLogRow): AgentLog {
  return {
    id: row.id,
    agentName: row.agent_name,
    taskDescription: row.task_description,
    modelUsed: row.model_used,
    status: row.status === "failed" ? "failed" : "completed",
    createdAt: row.created_at,
    todoId: row.todo_id,
  }
}

/**
 * Fetch agent logs linked to a specific task (todo).
 */
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

  // Count tasks per agent and find last active time
  const taskCounts = new Map<string, number>()
  const lastActive = new Map<string, string>()

  for (const log of logs) {
    const current = taskCounts.get(log.agentName) ?? 0
    taskCounts.set(log.agentName, current + 1)

    if (!lastActive.has(log.agentName)) {
      lastActive.set(log.agentName, log.createdAt)
    }
  }

  return staticAgents.map((agent) => ({
    ...agent,
    taskCount: taskCounts.get(agent.name) ?? 0,
    lastActive: lastActive.get(agent.name),
  }))
}
