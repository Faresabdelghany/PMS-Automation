import { supabase } from "@/lib/supabase"
import { getAvatarUrl } from "@/lib/assets/avatars"
import type { ProjectTask, WorkstreamTaskStatus, User } from "@/lib/data/project-details"

// ---------- DB row type ----------

type TodoRow = {
  id: string
  title: string
  status: string
  priority: string | null
  category: string | null
  due_date: string | null
  start_date: string | null
  description: string | null
  tag: string | null
  assignee: string | null
  sort_order: number
  created_at: string
  updated_at: string
  created_by_user: string | null
  created_by_agent: string | null
  updated_by_user: string | null
  updated_by_agent: string | null
  last_update_summary: string | null
  workflow_stage: string | null
}

// ---------- Mapping helpers ----------

const STATUS_TO_APP: Record<string, WorkstreamTaskStatus> = {
  todo: "todo",
  in_progress: "in-progress",
  done: "done",
}

const STATUS_TO_DB: Record<string, string> = {
  todo: "todo",
  "in-progress": "in_progress",
  done: "done",
}

function priorityToApp(dbPriority: string | null): ProjectTask["priority"] {
  if (!dbPriority) return "no-priority"
  const lower = dbPriority.toLowerCase() as ProjectTask["priority"]
  if (lower === "low" || lower === "medium" || lower === "high" || lower === "urgent") return lower
  return "no-priority"
}

function priorityToDb(appPriority: ProjectTask["priority"]): string | null {
  if (!appPriority || appPriority === "no-priority") return null
  return appPriority.charAt(0).toUpperCase() + appPriority.slice(1)
}

function userFromName(name: string): User {
  return {
    id: name.trim().toLowerCase().replace(/\s+/g, "-"),
    name,
    avatarUrl: getAvatarUrl(name),
  }
}

function rowToTask(row: TodoRow): ProjectTask {
  return {
    id: row.id,
    name: row.title,
    status: STATUS_TO_APP[row.status] ?? "todo",
    priority: priorityToApp(row.priority),
    category: row.category ?? undefined,
    tag: row.tag ?? undefined,
    description: row.description ?? undefined,
    dueLabel: row.due_date ?? undefined,
    startDate: row.start_date ? new Date(row.start_date) : undefined,
    assignee: row.assignee ? userFromName(row.assignee) : undefined,
    // category-based grouping: use category as both projectId/Name and workstream
    projectId: row.category ?? "uncategorized",
    projectName: row.category ?? "Uncategorized",
    workstreamId: row.category ?? "uncategorized",
    workstreamName: row.category ?? "Uncategorized",
    sortOrder: row.sort_order,
    createdByUser: row.created_by_user ?? undefined,
    createdByAgent: row.created_by_agent ?? undefined,
    updatedByUser: row.updated_by_user ?? undefined,
    updatedByAgent: row.updated_by_agent ?? undefined,
    lastUpdateSummary: row.last_update_summary ?? undefined,
    workflowStage: row.workflow_stage ?? undefined,
  }
}

// ---------- CRUD ----------

export async function fetchTasks(): Promise<ProjectTask[]> {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchTasks error:", error)
    return []
  }

  return (data as TodoRow[]).map(rowToTask)
}

export type CreateTaskInput = {
  name: string
  status: WorkstreamTaskStatus
  priority?: ProjectTask["priority"]
  category?: string
  tag?: string
  description?: string
  dueLabel?: string
  startDate?: Date
  assignee?: string
}

export async function createTask(input: CreateTaskInput): Promise<ProjectTask | null> {
  const { data, error } = await supabase
    .from("todos")
    .insert({
      title: input.name,
      status: STATUS_TO_DB[input.status] ?? "todo",
      priority: priorityToDb(input.priority),
      category: input.category || null,
      tag: input.tag || null,
      description: input.description || null,
      due_date: input.dueLabel || null,
      start_date: input.startDate ? input.startDate.toISOString().split("T")[0] : null,
      assignee: input.assignee || null,
    })
    .select()
    .single()

  if (error) {
    console.error("createTask error:", error)
    return null
  }

  return rowToTask(data as TodoRow)
}

export type UpdateTaskInput = Partial<{
  name: string
  status: WorkstreamTaskStatus
  priority: ProjectTask["priority"]
  category: string
  tag: string
  description: string
  dueLabel: string
  startDate: Date | null
  assignee: string | null
}>

export async function updateTask(id: string, input: UpdateTaskInput): Promise<ProjectTask | null> {
  const updates: Record<string, unknown> = {}

  if (input.name !== undefined) updates.title = input.name
  if (input.status !== undefined) updates.status = STATUS_TO_DB[input.status] ?? "todo"
  if (input.priority !== undefined) updates.priority = priorityToDb(input.priority)
  if (input.category !== undefined) updates.category = input.category || null
  if (input.tag !== undefined) updates.tag = input.tag || null
  if (input.description !== undefined) updates.description = input.description || null
  if (input.dueLabel !== undefined) updates.due_date = input.dueLabel || null
  if (input.startDate !== undefined) {
    updates.start_date = input.startDate ? input.startDate.toISOString().split("T")[0] : null
  }
  if (input.assignee !== undefined) updates.assignee = input.assignee

  if (Object.keys(updates).length === 0) return null

  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from("todos")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("updateTask error:", error)
    return null
  }

  return rowToTask(data as TodoRow)
}

export async function deleteTask(id: string): Promise<boolean> {
  const { error } = await supabase.from("todos").delete().eq("id", id)

  if (error) {
    console.error("deleteTask error:", error)
    return false
  }

  return true
}

export async function reorderTasks(orderedIds: string[]): Promise<boolean> {
  // Batch update sort_order for each task
  const updates = orderedIds.map((id, index) =>
    supabase.from("todos").update({ sort_order: index, updated_at: new Date().toISOString() }).eq("id", id),
  )

  const results = await Promise.all(updates)
  const hasError = results.some((r) => r.error)

  if (hasError) {
    console.error("reorderTasks errors:", results.filter((r) => r.error).map((r) => r.error))
    return false
  }

  return true
}
