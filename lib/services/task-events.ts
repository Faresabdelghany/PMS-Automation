import { supabase } from "@/lib/supabase"

// ---------- DB row type ----------

export type TaskEventRow = {
  id: string
  todo_id: string
  run_id: string | null
  event_type: string
  actor_type: string
  actor_name: string
  summary: string
  metadata: Record<string, unknown> | null
  created_at: string
}

// ---------- App type ----------

export type TaskEvent = {
  id: string
  todoId: string
  runId: string | null
  eventType: string
  actorType: string
  actorName: string
  summary: string
  metadata: Record<string, unknown>
  createdAt: string
}

// ---------- Mapping ----------

function rowToTaskEvent(row: TaskEventRow): TaskEvent {
  return {
    id: row.id,
    todoId: row.todo_id,
    runId: row.run_id,
    eventType: row.event_type,
    actorType: row.actor_type,
    actorName: row.actor_name,
    summary: row.summary,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  }
}

// ---------- Queries ----------

/** Fetch full event timeline for a task (ascending = timeline order) */
export async function fetchTaskEvents(todoId: string): Promise<TaskEvent[]> {
  const { data, error } = await supabase
    .from("task_events")
    .select("*")
    .eq("todo_id", todoId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("fetchTaskEvents error:", error)
    return []
  }

  return (data as TaskEventRow[]).map(rowToTaskEvent)
}

/** Fetch events for a specific agent run */
export async function fetchEventsByRun(runId: string): Promise<TaskEvent[]> {
  const { data, error } = await supabase
    .from("task_events")
    .select("*")
    .eq("run_id", runId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("fetchEventsByRun error:", error)
    return []
  }

  return (data as TaskEventRow[]).map(rowToTaskEvent)
}

/** Fetch events by type across all tasks */
export async function fetchEventsByType(eventType: string, limit = 50): Promise<TaskEvent[]> {
  const { data, error } = await supabase
    .from("task_events")
    .select("*")
    .eq("event_type", eventType)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("fetchEventsByType error:", error)
    return []
  }

  return (data as TaskEventRow[]).map(rowToTaskEvent)
}

/** Fetch recent events across all tasks */
export async function fetchRecentEvents(limit = 50): Promise<TaskEvent[]> {
  const { data, error } = await supabase
    .from("task_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("fetchRecentEvents error:", error)
    return []
  }

  return (data as TaskEventRow[]).map(rowToTaskEvent)
}
