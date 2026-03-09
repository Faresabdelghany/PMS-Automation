/**
 * @deprecated Runtime project data is now Supabase-backed via lib/services/projects.ts.
 * This module is retained for shared types/utilities only.
 */
export type Project = {
  id: string
  name: string
  taskCount: number
  progress: number
  startDate: Date
  endDate: Date
  status: "backlog" | "planned" | "active" | "cancelled" | "completed"
  priority: "urgent" | "high" | "medium" | "low"
  tags: string[]
  members: string[]
  // Optional subtitle fields for card/list view
  client?: string
  typeLabel?: string
  durationLabel?: string
  tasks: Array<{
    id: string
    name: string
    type: "bug" | "improvement" | "task"
    assignee: string
    status: "todo" | "in-progress" | "done"
    startDate: Date
    endDate: Date
  }>
}

/**
 * @deprecated Use fetchProjects() from lib/services/projects.ts instead.
 * This empty array is retained only for backward compatibility with imports
 * that reference `projects` directly. It will always be empty.
 */
export const projects: Project[] = []

export type FilterCounts = {
  status?: Record<string, number>
  priority?: Record<string, number>
  tags?: Record<string, number>
  members?: Record<string, number>
}

export function computeFilterCounts(list: Project[]): FilterCounts {
  const res: FilterCounts = {
    status: {},
    priority: {},
    tags: {},
    members: {},
  }
  for (const p of list) {
    // status
    res.status![p.status] = (res.status![p.status] || 0) + 1
    // priority
    res.priority![p.priority] = (res.priority![p.priority] || 0) + 1
    // tags
    for (const t of p.tags) {
      const id = t.toLowerCase()
      res.tags![id] = (res.tags![id] || 0) + 1
    }
    // members buckets
    if (p.members.length === 0) {
      res.members!["no-member"] = (res.members!["no-member"] || 0) + 1
    }
    if (p.members.length > 0) {
      res.members!["current"] = (res.members!["current"] || 0) + 1
    }
    if (p.members.some((m) => m.toLowerCase() === "jason duong")) {
      res.members!["jason"] = (res.members!["jason"] || 0) + 1
    }
  }
  return res
}
