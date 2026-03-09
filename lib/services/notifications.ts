import { supabase } from "@/lib/supabase"

export type NotificationType =
  | "comment_added"
  | "task_assigned"
  | "task_status_changed"
  | "milestone_completed"
  | "project_created"
  | "weekly_summary_ready"
  | "deadline_approaching"

export type NotificationEntityType = "task" | "project" | "client" | "comment" | "system"

export type NotificationRow = {
  id: string
  recipient: string
  type: NotificationType
  title: string
  summary: string
  entity_type: NotificationEntityType
  entity_id: string | null
  source_event_id: string | null
  is_read: boolean
  read_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type InboxCategory = "comment" | "task" | "client" | "project" | "system"

export type InboxNotification = {
  id: string
  type: NotificationType
  category: InboxCategory
  title: string
  summary: string
  createdAt: Date
  unread: boolean
  entityType: NotificationEntityType
  entityId: string | null
  metadata: Record<string, unknown>
}

export type NotificationFilters = {
  unreadOnly?: boolean
  categories?: InboxCategory[]
  clients?: string[]
  limit?: number
}

function toCategory(type: NotificationType): InboxCategory {
  if (type === "comment_added") return "comment"
  if (type === "task_assigned" || type === "task_status_changed" || type === "deadline_approaching") return "task"
  if (type === "project_created" || type === "milestone_completed") return "project"
  return "system"
}

function rowToNotification(row: NotificationRow): InboxNotification {
  return {
    id: row.id,
    type: row.type,
    category: toCategory(row.type),
    title: row.title,
    summary: row.summary,
    createdAt: new Date(row.created_at),
    unread: !row.is_read,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata ?? {},
  }
}

export async function fetchNotifications(filters: NotificationFilters = {}): Promise<InboxNotification[]> {
  const { unreadOnly = false, categories = [], clients = [], limit = 200 } = filters

  let query = supabase
    .from("inbox_notifications")
    .select("*")
    .eq("recipient", "workspace")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (unreadOnly) {
    query = query.eq("is_read", false)
  }

  const { data, error } = await query
  if (error) {
    console.error("fetchNotifications error:", error)
    return []
  }

  let notifications = (data as NotificationRow[]).map(rowToNotification)

  if (categories.length > 0) {
    notifications = notifications.filter((n) => categories.includes(n.category))
  }

  if (clients.length > 0) {
    notifications = notifications.filter((n) => {
      const c = (n.metadata.client as string | undefined) ?? (n.metadata.client_name as string | undefined)
      return !!c && clients.includes(c)
    })
  }

  return notifications
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("inbox_notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    console.error("markNotificationRead error:", error)
    return false
  }

  return true
}

export async function markAllNotificationsRead(): Promise<boolean> {
  const { error } = await supabase
    .from("inbox_notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("recipient", "workspace")
    .eq("is_read", false)

  if (error) {
    console.error("markAllNotificationsRead error:", error)
    return false
  }

  return true
}

export function getNotificationRoute(item: InboxNotification): string | null {
  if (item.entityType === "project" && item.entityId) {
    return `/projects/${item.entityId}`
  }

  if (item.entityType === "task" && item.entityId) {
    return `/tasks?taskId=${item.entityId}`
  }

  if (item.entityType === "client" && item.entityId) {
    return `/clients/${item.entityId}`
  }

  const relatedTaskId = item.metadata.todo_id as string | undefined
  if (relatedTaskId) return `/tasks?taskId=${relatedTaskId}`

  return null
}
