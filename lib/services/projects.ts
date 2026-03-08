import { supabase } from "@/lib/supabase"
import type { Project } from "@/lib/data/projects"
import type { ProjectDetails, ProjectTask, WorkstreamGroup } from "@/lib/data/project-details"

type ProjectRow = {
  id: string
  name: string
  description: string
  status: Project["status"]
  priority: Project["priority"]
  start_date: string
  end_date: string
  progress: number
  tags: string[] | null
  members: string[] | null
  client: string | null
  type_label: string | null
  duration_label: string | null
}

type TodoRow = {
  id: string
  title: string
  status: string
  assignee: string | null
  start_date: string | null
  due_date: string | null
  category: string | null
  description: string | null
  priority: string | null
  tag: string | null
  task_type: string
  project_id: string | null
}

function mapStatus(status: string): "todo" | "in-progress" | "done" {
  if (status === "in_progress") return "in-progress"
  if (status === "done") return "done"
  return "todo"
}

function mapTaskType(tag?: string | null): "bug" | "improvement" | "task" {
  const t = (tag ?? "").toLowerCase()
  if (t.includes("bug")) return "bug"
  if (t.includes("improvement")) return "improvement"
  return "task"
}

function mapProject(row: ProjectRow, todos: TodoRow[]): Project {
  const linkedTodos = todos.filter((t) => t.project_id === row.id)

  return {
    id: row.id,
    name: row.name,
    taskCount: linkedTodos.length,
    progress: row.progress,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    status: row.status,
    priority: row.priority,
    tags: row.tags ?? [],
    members: row.members ?? [],
    client: row.client ?? undefined,
    typeLabel: row.type_label ?? undefined,
    durationLabel: row.duration_label ?? undefined,
    tasks: linkedTodos.map((t) => ({
      id: t.id,
      name: t.title,
      type: mapTaskType(t.tag),
      assignee: t.assignee ?? "Unassigned",
      status: mapStatus(t.status),
      startDate: t.start_date ? new Date(t.start_date) : new Date(row.start_date),
      endDate: t.due_date ? new Date(t.due_date) : (t.start_date ? new Date(t.start_date) : new Date(row.end_date)),
    })),
  }
}

export async function fetchProjects(): Promise<Project[]> {
  const [{ data: projectRows, error: projectsError }, { data: todoRows, error: todosError }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase
      .from("todos")
      .select("id,title,status,assignee,start_date,due_date,category,description,priority,tag,task_type,project_id")
      .neq("task_type", "system_task"),
  ])

  if (projectsError) throw new Error(`Failed to load projects: ${projectsError.message}`)
  if (todosError) throw new Error(`Failed to load project tasks: ${todosError.message}`)

  const projects = (projectRows as ProjectRow[]).map((p) => mapProject(p, todoRows as TodoRow[]))
  return projects
}

function toProjectTasks(project: Project): ProjectTask[] {
  return project.tasks.map((t) => ({
    id: t.id,
    name: t.name,
    status: t.status,
    assignee: t.assignee
      ? {
          id: t.assignee.toLowerCase().replace(/\s+/g, "-"),
          name: t.assignee,
        }
      : undefined,
    startDate: t.startDate,
    dueLabel: t.endDate.toISOString().split("T")[0],
    priority: project.priority,
    tag: t.type,
    description: undefined,
    category: "Work",
    projectId: project.id,
    projectName: project.name,
    workstreamId: "main",
    workstreamName: "Main",
  }))
}

export async function fetchProjectDetailsById(projectId: string): Promise<ProjectDetails | null> {
  const projects = await fetchProjects()
  const project = projects.find((p) => p.id === projectId)
  if (!project) return null

  const projectTasks = toProjectTasks(project)
  const byCategory = new Map<string, ProjectTask[]>()
  for (const task of projectTasks) {
    const key = task.category ?? "General"
    const list = byCategory.get(key) ?? []
    list.push(task)
    byCategory.set(key, list)
  }

  const workstreams: WorkstreamGroup[] = Array.from(byCategory.entries()).map(([name, tasks], i) => ({
    id: `ws-${i + 1}`,
    name,
    tasks,
  }))

  return {
    id: project.id,
    name: project.name,
    description: project.client ? `${project.client} • ${project.typeLabel ?? "Project"}` : `${project.typeLabel ?? "Project"}`,
    meta: {
      priorityLabel: project.priority.charAt(0).toUpperCase() + project.priority.slice(1),
      locationLabel: project.client ?? "Internal",
      sprintLabel: project.durationLabel ?? "-",
      lastSyncLabel: "Live",
    },
    scope: { inScope: [], outOfScope: [] },
    outcomes: [],
    keyFeatures: { p0: [], p1: [], p2: [] },
    timelineTasks: project.tasks.map((t) => ({
      id: t.id,
      name: t.name,
      startDate: t.startDate,
      endDate: t.endDate,
      status: t.status === "todo" ? "planned" : t.status === "in-progress" ? "in-progress" : "done",
    })),
    workstreams,
    time: {
      estimateLabel: project.durationLabel ?? "-",
      dueDate: project.endDate,
      daysRemainingLabel: "",
      progressPercent: project.progress,
    },
    backlog: {
      statusLabel: project.status === "active" ? "Active" : project.status === "backlog" ? "Backlog" : project.status === "planned" ? "Planned" : project.status === "completed" ? "Completed" : "Cancelled",
      groupLabel: "Work",
      priorityLabel: project.priority,
      labelBadge: project.typeLabel ?? "",
      picUsers: (project.members.length ? project.members : ["Unassigned"]).map((m) => ({ id: m.toLowerCase().replace(/\s+/g, "-"), name: m })),
    },
    quickLinks: [],
    files: [],
    notes: [],
  }
}
