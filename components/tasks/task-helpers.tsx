"use client"

import { format } from "date-fns"
import { DotsSixVertical, FolderSimple, Plus } from "@phosphor-icons/react/dist/ssr"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import type { FilterCounts } from "@/lib/data/projects"
import type { ProjectTask } from "@/lib/data/project-details"
import { TaskRowBase } from "@/components/tasks/TaskRowBase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProgressCircle } from "@/components/progress-circle"
import { cn } from "@/lib/utils"
import type { FilterChip as FilterChipType } from "@/lib/view-options"
import type { CreateTaskContext } from "@/components/tasks/TaskQuickCreateModal"

export type CategoryTaskGroup = {
  id: string
  name: string
  tasks: ProjectTask[]
}

/** @deprecated Use CategoryTaskGroup instead */
export type ProjectTaskGroup = CategoryTaskGroup

export function filterTasksByChips(tasks: ProjectTask[], chips: FilterChipType[]): ProjectTask[] {
  if (!chips.length) return tasks

  const memberValues = chips
    .filter((chip) => chip.key.toLowerCase().startsWith("member") || chip.key.toLowerCase() === "pic")
    .map((chip) => chip.value.toLowerCase())

  const statusValues = chips
    .filter((chip) => chip.key.toLowerCase() === "status")
    .map((chip) => chip.value.toLowerCase())

  const priorityValues = chips
    .filter((chip) => chip.key.toLowerCase() === "priority")
    .map((chip) => chip.value.toLowerCase())

  const tagValues = chips
    .filter((chip) => chip.key.toLowerCase() === "tag" || chip.key.toLowerCase() === "tags")
    .map((chip) => chip.value.toLowerCase())

  return tasks.filter((task) => {
    // Status filter
    if (statusValues.length) {
      const taskStatus = task.status.toLowerCase()
      if (!statusValues.some((v) => taskStatus === v)) return false
    }

    // Priority filter
    if (priorityValues.length) {
      const taskPriority = (task.priority ?? "no-priority").toLowerCase()
      if (!priorityValues.some((v) => taskPriority === v)) return false
    }

    // Tag filter
    if (tagValues.length) {
      const taskTag = (task.tag ?? "").toLowerCase()
      if (!taskTag || !tagValues.some((v) => taskTag === v)) return false
    }

    // Member filter
    if (memberValues.length) {
      const name = task.assignee?.name.toLowerCase() ?? ""
      const memberMatch = memberValues.some((value) => {
        if (value === "unassigned" && !task.assignee) return true
        return value && name === value
      })
      if (!memberMatch) return false
    }

    return true
  })
}

export function computeTaskFilterCounts(tasks: ProjectTask[]): FilterCounts {
  const counts: FilterCounts = {
    status: {
      "todo": 0,
      "in-progress": 0,
      "done": 0,
    },
    priority: {},
    tags: {},
    members: {
      "unassigned": 0,
    },
  }

  for (const task of tasks) {
    // Status counts
    const status = task.status
    counts.status![status] = (counts.status![status] || 0) + 1

    // Priority counts
    const priority = task.priority ?? "no-priority"
    counts.priority![priority] = (counts.priority![priority] || 0) + 1

    // Tag counts
    if (task.tag) {
      counts.tags![task.tag] = (counts.tags![task.tag] || 0) + 1
    }

    // Member counts — dynamically keyed by assignee name
    if (!task.assignee) {
      counts.members!["unassigned"] = (counts.members!["unassigned"] || 0) + 1
    } else {
      const key = task.assignee.name
      counts.members![key] = (counts.members![key] || 0) + 1
    }
  }

  return counts
}

/** Derive member options from task data for the filter popover */
export function deriveTaskMemberOptions(tasks: ProjectTask[]): { id: string; label: string }[] {
  const members = new Map<string, number>()

  for (const task of tasks) {
    if (!task.assignee) {
      // counted as "unassigned"
    } else {
      members.set(task.assignee.name, (members.get(task.assignee.name) || 0) + 1)
    }
  }

  const options: { id: string; label: string }[] = [
    { id: "unassigned", label: "Unassigned" },
  ]

  const sorted = [...members.keys()].sort((a, b) => a.localeCompare(b))
  for (const name of sorted) {
    options.push({ id: name, label: name })
  }

  return options
}

/** Derive priority options from task data for the filter popover */
export function deriveTaskPriorityOptions(tasks: ProjectTask[]): { id: string; label: string }[] {
  const priorities = new Set<string>()
  for (const task of tasks) {
    priorities.add(task.priority ?? "no-priority")
  }

  // Fixed display order
  const ORDER = ["urgent", "high", "medium", "low", "no-priority"]
  const LABELS: Record<string, string> = {
    urgent: "Urgent",
    high: "High",
    medium: "Medium",
    low: "Low",
    "no-priority": "No Priority",
  }

  return ORDER
    .filter((p) => priorities.has(p))
    .map((p) => ({ id: p, label: LABELS[p] ?? p }))
}

/** Derive tag options from task data for the filter popover */
export function deriveTaskTagOptions(tasks: ProjectTask[]): { id: string; label: string }[] {
  const tags = new Map<string, number>()
  for (const task of tasks) {
    if (task.tag) {
      tags.set(task.tag, (tags.get(task.tag) || 0) + 1)
    }
  }

  return [...tags.keys()]
    .sort((a, b) => a.localeCompare(b))
    .map((t) => ({ id: t, label: t }))
}

export function getTaskDescriptionSnippet(task: ProjectTask): string {
  if (!task.description) return ""
  const plain = task.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  return plain
}

export type ProjectTasksSectionProps = {
  group: CategoryTaskGroup
  onToggleTask: (taskId: string) => void
  onAddTask: (context: CreateTaskContext) => void
  onTaskClick?: (task: ProjectTask) => void
}

export function ProjectTasksSection({ group, onToggleTask, onAddTask, onTaskClick }: ProjectTasksSectionProps) {
  const { id, name, tasks } = group
  const total = tasks.length
  const done = tasks.filter((t) => t.status === "done").length
  const percent = total ? Math.round((done / total) * 100) : 0

  return (
    <section className="max-w-6xl mx-auto rounded-3xl border border-border bg-muted shadow-[var(--shadow-workstream)] p-3 space-y-2">
      <header className="flex items-center justify-between gap-4 px-0 py-1">
        <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
          <FolderSimple className="h-5 w-5" weight="regular" />
        </div>
        <div className="flex-1 space-y-1">
          <span className="text-sm font-semibold leading-tight">{name}</span>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">
              {done}/{total} done
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <ProgressCircle progress={percent} color="var(--chart-2)" size={18} />
          <div className="h-4 w-px bg-border/80" />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="size-7 rounded-full text-muted-foreground hover:bg-transparent"
            aria-label="Add task"
            onClick={() =>
              onAddTask({
                projectId: id,
                workstreamName: name,
              })
            }
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="space-y-1 px-2 py-3 bg-background rounded-2xl border border-border">
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskRowDnD
              key={task.id}
              task={task}
              onToggle={() => onToggleTask(task.id)}
              onTaskClick={onTaskClick}
            />
          ))}
        </SortableContext>
      </div>
    </section>
  )
}

export type TaskBadgesProps = {
  workstreamName?: string
  className?: string
}

export function TaskBadges({ workstreamName, className }: TaskBadgesProps) {
  if (!workstreamName) return null

  return (
    <Badge variant="muted" className={cn("whitespace-nowrap text-[11px]", className)}>
      {workstreamName}
    </Badge>
  )
}

export type TaskStatusProps = {
  status: ProjectTask["status"]
}

export function TaskStatus({ status }: TaskStatusProps) {
  const label = getStatusLabel(status)
  const color = getStatusColor(status)

  return <span className={cn("font-medium", color)}>{label}</span>
}

function getStatusLabel(status: ProjectTask["status"]): string {
  switch (status) {
    case "done":
      return "Done"
    case "in-progress":
      return "In Progress"
    default:
      return "To do"
  }
}

function getStatusColor(status: ProjectTask["status"]): string {
  switch (status) {
    case "done":
      return "text-emerald-500"
    case "in-progress":
      return "text-amber-500"
    default:
      return "text-muted-foreground"
  }
}


function capitalize(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export type TaskPriorityProps = {
  priority: NonNullable<ProjectTask["priority"]>
  className?: string
}

export function TaskPriority({ priority, className }: TaskPriorityProps) {
  const label = getPriorityLabel(priority)

  return (
    <span className={cn("rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground", className)}>
      {label}
    </span>
  )
}

function getPriorityLabel(priority: NonNullable<ProjectTask["priority"]>): string {
  switch (priority) {
    case "high":
      return "High"
    case "medium":
      return "Medium"
    case "low":
      return "Low"
    case "urgent":
      return "Urgent"
    default:
      return "No priority"
  }
}

export type TaskRowDnDProps = {
  task: ProjectTask
  onToggle: () => void
  onTaskClick?: (task: ProjectTask) => void
}

export function TaskRowDnD({ task, onToggle, onTaskClick }: TaskRowDnDProps) {
  const isDone = task.status === "done"

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <TaskRowBase
        checked={isDone}
        title={task.name}
        onCheckedChange={onToggle}
        onTitleClick={onTaskClick ? () => onTaskClick(task) : undefined}
        titleAriaLabel={task.name}
        titleSuffix={<TaskBadges workstreamName={task.workstreamName} className="hidden sm:inline" />}
        subtitle={<div className="hidden sm:inline">{getTaskDescriptionSnippet(task)}</div>}
        meta={
          <>
            <TaskStatus status={task.status} />
            {task.startDate && (
              <span className="text-muted-foreground hidden sm:inline">
                Start: {format(task.startDate, "dd/MM")}
              </span>
            )}
            {task.dueLabel && (
              <span className="text-muted-foreground hidden sm:inline">{task.dueLabel}</span>
            )}
            {task.priority && <TaskPriority priority={task.priority} className="hidden sm:inline" />}
            {task.tag && (
              <Badge variant="outline" className="whitespace-nowrap text-[11px] hidden sm:inline">
                {task.tag}
              </Badge>
            )}
            {task.assignee && (
              <Avatar className="size-6">
                {task.assignee.avatarUrl && (
                  <AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} />
                )}
                <AvatarFallback>{task.assignee.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="size-7 rounded-md text-muted-foreground cursor-grab active:cursor-grabbing"
              aria-label="Reorder task"
              {...attributes}
              {...listeners}
            >
              <DotsSixVertical className="h-4 w-4" weight="regular" />
            </Button>
          </>
        }
        className={isDragging ? "opacity-60" : ""}
      />
    </div>
  )
}

export type ProjectTaskListViewProps = {
  groups: ProjectTaskGroup[]
  onToggleTask: (taskId: string) => void
  onAddTask: (context: CreateTaskContext) => void
  onTaskClick?: (task: ProjectTask) => void
}

export function ProjectTaskListView({ groups, onToggleTask, onAddTask, onTaskClick }: ProjectTaskListViewProps) {
  return (
    <>
      {groups.map((group) => (
        <ProjectTasksSection
          key={group.id}
          group={group}
          onToggleTask={onToggleTask}
          onAddTask={onAddTask}
          onTaskClick={onTaskClick}
        />
      ))}
    </>
  )
}
