import { supabase } from "@/lib/supabase"
import { getAvatarUrl } from "@/lib/assets/avatars"
import type { ProjectTask, WorkstreamTaskStatus, User } from "@/lib/data/project-details"

// ---------- DB row type (full todos table) ----------

export const TASK_TYPES = ["user_task", "agent_task", "system_task"] as const
export type TaskType = (typeof TASK_TYPES)[number]

export const LIFECYCLE_STATUSES = [
  "queued", "ready", "in_progress", "dev_done", "in_test",
  "changes_requested", "tested_passed", "in_review", "done", "failed", "cancelled",
] as const
export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number]

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
  task_type: TaskType
  project_id: string | null
  // New workflow contract columns
  parent_task_id: string | null
  order_index: number | null
  source: string | null
  acceptance_criteria: string | null
  lifecycle_status: string | null
  current_run_id: string | null
  track_status: string | null
  claimed_by: string | null
  claimed_at: string | null
  source_message_id: string | null
  source_channel: string | null
  completed_at: string | null
  failed_at: string | null
  archived_at: string | null
  last_event_at: string | null
}

export type TaskTypeFilter = TaskType | "all"

// ---------- Extended ProjectTask with workflow fields ----------

export type ExtendedProjectTask = ProjectTask & {
  parentTaskId?: string
  orderIndex?: number
  source?: string
  acceptanceCriteria?: string
  lifecycleStatus?: LifecycleStatus
  currentRunId?: string
  trackStatus?: string
  claimedBy?: string
  claimedAt?: string
  sourceMessageId?: string
  sourceChannel?: string
  completedAt?: string
  failedAt?: string
  archivedAt?: string
  lastEventAt?: string
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

/** Map lifecycle_status to a user-friendly display status */
export function lifecycleToDisplay(lifecycle: string | null): WorkstreamTaskStatus {
  if (!lifecycle) return "todo"
  switch (lifecycle) {
    case "queued":
    case "ready":
    case "changes_requested":
      return "todo"
    case "in_progress":
    case "dev_done":
    case "in_test":
    case "in_review":
    case "tested_passed":
      return "in-progress"
    case "done":
      return "done"
    case "failed":
    case "cancelled":
      return "done" // terminal states show as done in simple view
    default:
      return "todo"
  }
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

function normalizeTaskType(value: string | null | undefined): TaskType {
  if (value === "agent_task" || value === "system_task") return value
  return "user_task"
}

function rowToTask(row: TodoRow): ExtendedProjectTask {
  // Use lifecycle_status as primary status when available (child tasks)
  const displayStatus = row.lifecycle_status
    ? lifecycleToDisplay(row.lifecycle_status)
    : (STATUS_TO_APP[row.status] ?? "todo")

  return {
    id: row.id,
    name: row.title,
    status: displayStatus,
    priority: priorityToApp(row.priority),
    category: row.category ?? undefined,
    tag: row.tag ?? undefined,
    description: row.description ?? undefined,
    dueLabel: row.due_date ?? undefined,
    startDate: row.start_date ? new Date(row.start_date) : undefined,
    assignee: row.assignee ? userFromName(row.assignee) : undefined,
    projectId: row.project_id ?? row.category ?? "uncategorized",
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
    taskType: normalizeTaskType(row.task_type),
    // New workflow fields
    parentTaskId: row.parent_task_id ?? undefined,
    orderIndex: row.order_index ?? undefined,
    source: row.source ?? undefined,
    acceptanceCriteria: row.acceptance_criteria ?? undefined,
    lifecycleStatus: (row.lifecycle_status as LifecycleStatus) ?? undefined,
    currentRunId: row.current_run_id ?? undefined,
    trackStatus: row.track_status ?? undefined,
    claimedBy: row.claimed_by ?? undefined,
    claimedAt: row.claimed_at ?? undefined,
    sourceMessageId: row.source_message_id ?? undefined,
    sourceChannel: row.source_channel ?? undefined,
    completedAt: row.completed_at ?? undefined,
    failedAt: row.failed_at ?? undefined,
    archivedAt: row.archived_at ?? undefined,
    lastEventAt: row.last_event_at ?? undefined,
  }
}

// ---------- CRUD ----------

export async function fetchTasks(taskType: TaskTypeFilter = "user_task"): Promise<ExtendedProjectTask[]> {
  const table = taskType === "user_task" ? "v_user_tasks" : "todos"

  let query = supabase
    .from(table)
    .select("*")
    .order("created_at", { ascending: false })

  if (taskType !== "all" && taskType !== "user_task") {
    query = query.eq("task_type", taskType)
  }

  const { data, error } = await query

  if (error) {
    console.error("fetchTasks error:", error)
    throw new Error(`Failed to load tasks: ${error.message}`)
  }

  return (data as TodoRow[]).map(rowToTask)
}

export async function fetchUserTasks(): Promise<ExtendedProjectTask[]> {
  return fetchTasks("user_task")
}

export async function fetchInternalTasks(): Promise<ExtendedProjectTask[]> {
  const all = await fetchTasks("all")
  return all.filter((task) => task.taskType !== "user_task")
}

export async function fetchTaskById(id: string): Promise<ExtendedProjectTask | null> {
  const { data, error } = await supabase.from("todos").select("*").eq("id", id).single()

  if (error) {
    console.error("fetchTaskById error:", error)
    return null
  }

  return rowToTask(data as TodoRow)
}

/** Fetch ordered child tasks for a parent task (SpecKit decomposition) */
export async function fetchChildTasks(parentTaskId: string): Promise<ExtendedProjectTask[]> {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("parent_task_id", parentTaskId)
    .order("order_index", { ascending: true })

  if (error) {
    console.error("fetchChildTasks error:", error)
    return []
  }

  return (data as TodoRow[]).map(rowToTask)
}

/** Fetch all tasks linked to a project */
export async function fetchTasksByProject(projectId: string): Promise<ExtendedProjectTask[]> {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchTasksByProject error:", error)
    return []
  }

  return (data as TodoRow[]).map(rowToTask)
}

/** Fetch tasks by lifecycle_status (workflow state) */
export async function fetchTasksByLifecycleStatus(status: LifecycleStatus): Promise<ExtendedProjectTask[]> {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("lifecycle_status", status)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchTasksByLifecycleStatus error:", error)
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
  taskType?: TaskType
  projectId?: string
  // New workflow fields
  parentTaskId?: string
  orderIndex?: number
  source?: string
  acceptanceCriteria?: string
  lifecycleStatus?: LifecycleStatus
}

export async function createTask(input: CreateTaskInput): Promise<ExtendedProjectTask | null> {
  const payload: Record<string, unknown> = {
    title: input.name,
    status: STATUS_TO_DB[input.status] ?? "todo",
    priority: priorityToDb(input.priority),
    category: input.category || null,
    tag: input.tag || null,
    description: input.description || null,
    due_date: input.dueLabel || null,
    start_date: input.startDate ? input.startDate.toISOString().split("T")[0] : null,
    assignee: input.assignee || null,
    task_type: input.taskType ?? "user_task",
    project_id: input.projectId ?? null,
  }

  if (input.parentTaskId) payload.parent_task_id = input.parentTaskId
  if (input.orderIndex !== undefined) payload.order_index = input.orderIndex
  if (input.source) payload.source = input.source
  if (input.acceptanceCriteria) payload.acceptance_criteria = input.acceptanceCriteria
  if (input.lifecycleStatus) payload.lifecycle_status = input.lifecycleStatus

  const { data, error } = await supabase
    .from("todos")
    .insert(payload)
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
  projectId: string | null
  // New workflow fields
  lifecycleStatus: LifecycleStatus
  acceptanceCriteria: string
  parentTaskId: string | null
}>

export async function updateTask(id: string, input: UpdateTaskInput): Promise<ExtendedProjectTask | null> {
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
  if (input.projectId !== undefined) updates.project_id = input.projectId
  if (input.lifecycleStatus !== undefined) updates.lifecycle_status = input.lifecycleStatus
  if (input.acceptanceCriteria !== undefined) updates.acceptance_criteria = input.acceptanceCriteria
  if (input.parentTaskId !== undefined) updates.parent_task_id = input.parentTaskId

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
