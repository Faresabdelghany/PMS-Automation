import { supabase } from "@/lib/supabase"

// ---------- DB row type ----------

type AgentRunRow = {
  id: string
  todo_id: string | null
  parent_run_id: string | null
  agent_name: string
  status: string
  input_summary: string | null
  output_summary: string | null
  error_message: string | null
  started_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

// ---------- App type ----------

export type AgentRun = {
  id: string
  todoId: string | null
  parentRunId: string | null
  agentName: string
  status: "queued" | "running" | "completed" | "failed" | "cancelled" | "stale_timeout"
  inputSummary: string | null
  outputSummary: string | null
  errorMessage: string | null
  startedAt: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

// ---------- Mapping ----------

function rowToRun(row: AgentRunRow): AgentRun {
  return {
    id: row.id,
    todoId: row.todo_id,
    parentRunId: row.parent_run_id,
    agentName: row.agent_name,
    status: row.status as AgentRun["status"],
    inputSummary: row.input_summary,
    outputSummary: row.output_summary,
    errorMessage: row.error_message,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ---------- Queries ----------

/** Fetch all runs linked to a task */
export async function fetchRunsByTask(todoId: string): Promise<AgentRun[]> {
  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("todo_id", todoId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchRunsByTask error:", error)
    return []
  }

  return (data as AgentRunRow[]).map(rowToRun)
}

/** Fetch child runs of an orchestration (parent) run */
export async function fetchRunsByParentRun(parentRunId: string): Promise<AgentRun[]> {
  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("parent_run_id", parentRunId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("fetchRunsByParentRun error:", error)
    return []
  }

  return (data as AgentRunRow[]).map(rowToRun)
}

/** Fetch currently active (running/pending) agent runs */
export async function fetchActiveRuns(): Promise<AgentRun[]> {
  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .in("status", ["running", "queued"])
    .order("started_at", { ascending: false })

  if (error) {
    console.error("fetchActiveRuns error:", error)
    return []
  }

  return (data as AgentRunRow[]).map(rowToRun)
}

/** Fetch a single run by ID */
export async function fetchRunById(runId: string): Promise<AgentRun | null> {
  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("id", runId)
    .single()

  if (error) {
    console.error("fetchRunById error:", error)
    return null
  }

  return rowToRun(data as AgentRunRow)
}

/** Fetch recent runs across all agents */
export async function fetchRecentRuns(limit = 50): Promise<AgentRun[]> {
  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("fetchRecentRuns error:", error)
    return []
  }

  return (data as AgentRunRow[]).map(rowToRun)
}
