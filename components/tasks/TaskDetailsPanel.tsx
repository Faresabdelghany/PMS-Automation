"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { ProjectTask, WorkstreamTaskStatus } from "@/lib/data/project-details"
import { getAvatarUrl } from "@/lib/assets/avatars"
import { X, ArrowLineRight, ArrowsOut, ShareNetwork, Eye, DotsThree, CheckCircle, Plus, CaretDown, Check } from "@phosphor-icons/react/dist/ssr"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { ProgressCircle } from "@/components/progress-circle"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr"
import { CommentsTab } from "@/components/tasks/CommentsTab"
import { fetchTaskById, updateTask as updateTaskService, type ExtendedProjectTask } from "@/lib/services/tasks"
import { fetchAgentLogsByTask, type AgentLog } from "@/lib/services/agents"
import { fetchSubtasks, createSubtask, updateSubtask } from "@/lib/services/subtasks"
import { fetchTaskEvents, type TaskEvent } from "@/lib/services/task-events"
import { fetchRunsByTask, type AgentRun } from "@/lib/services/agent-runs"
import { fetchChildTasks } from "@/lib/services/tasks"
import { LifecycleBadge, LifecycleTimeline } from "@/components/ui/lifecycle-badge"
import { useTaskRealtime } from "@/lib/hooks/use-realtime"
import { toast } from "sonner"

type TaskDetailsPanelProps = {
  task: ProjectTask | null
  open: boolean
  onClose: () => void
  onTaskUpdated?: (task: ProjectTask) => void
}

type ActivityDetail =
  | { type: "checklist"; item: string; checked: boolean }
  | { type: "status_change"; from: string; to: string }
  | { type: "priority_change"; from: string; to: string }
  | { type: "date_change"; field: string; value: string }
  | { type: "field_edit"; field: string; value: string }
  | { type: "subtask_added"; name: string }

type Activity = {
  id: string
  user: { name: string }
  action: string
  taskName?: string
  timestamp: Date
  detail: ActivityDetail
}

const CURRENT_USER = "Fares"

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do", bg: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  { value: "in-progress", label: "In Progress", bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "done", label: "Done", bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
] as const

const PRIORITY_OPTIONS = [
  { value: "no-priority", label: "None", dot: "bg-gray-400" },
  { value: "low", label: "Low", dot: "bg-green-500" },
  { value: "medium", label: "Medium", dot: "bg-yellow-500" },
  { value: "high", label: "High", dot: "bg-orange-500" },
  { value: "urgent", label: "Urgent", dot: "bg-red-500" },
] as const

const ASSIGNEE_OPTIONS = [
  { id: "ziko", name: "Ziko" },
  { id: "product-analyst", name: "Product Analyst" },
  { id: "dev", name: "Dev" },
  { id: "testing-agent", name: "Testing Agent" },
  { id: "code-reviewer", name: "Code Reviewer" },
  { id: "designer", name: "Designer" },
  { id: "marketing-agent", name: "Marketing Agent" },
  { id: "job-search-agent", name: "Job Search Agent" },
] as const

const AGENT_EMOJIS: Record<string, string> = {
  "Ziko": "⚡",
  "Product Analyst": "🧠",
  "Dev": "🛠️",
  "Testing Agent": "🧪",
  "Code Reviewer": "🔍",
  "Designer": "🎨",
  "Marketing Agent": "📣",
  "Job Search Agent": "💼",
}

const EVENT_COLORS: Record<string, string> = {
  task_started: "border-l-amber-500",
  task_completed: "border-l-emerald-500",
  task_failed: "border-l-red-500",
  agent_spawned: "border-l-blue-500",
  agent_message: "border-l-zinc-400",
  test_started: "border-l-purple-500",
  test_passed: "border-l-lime-500",
  test_failed: "border-l-red-500",
  review_started: "border-l-indigo-500",
  review_completed: "border-l-emerald-500",
  review_approved: "border-l-emerald-600",
}

type EditingField = "title" | "description" | "startDate" | "dueDate" | null
type Subtask = { id: string; name: string; done: boolean; note?: string }

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHrs = Math.floor(diffMin / 60)
  if (diffSec < 10) return "just now"
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  return `${Math.floor(diffHrs / 24)}d ago`
}

function formatDuration(startedAt: string, completedAt?: string | null): string {
  const start = new Date(startedAt).getTime()
  const end = completedAt ? new Date(completedAt).getTime() : Date.now()
  const diffSec = Math.floor((end - start) / 1000)
  if (diffSec < 60) return `${diffSec}s`
  const min = Math.floor(diffSec / 60)
  return min < 60 ? `${min}m ${diffSec % 60}s` : `${Math.floor(min / 60)}h ${min % 60}m`
}

export function TaskDetailsPanel({ task, open, onClose, onTaskUpdated }: TaskDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<"subtasks" | "comments" | "activities" | "runs">("activities")
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [newSubtaskName, setNewSubtaskName] = useState("")
  const addInputRef = useRef<HTMLInputElement>(null)

  const [editingField, setEditingField] = useState<EditingField>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editStatus, setEditStatus] = useState<string>("todo")
  const [editStartDate, setEditStartDate] = useState("")
  const [editDueDate, setEditDueDate] = useState("")
  const [editPriority, setEditPriority] = useState<string>("no-priority")
  const [editAssignee, setEditAssignee] = useState<string>("")
  const editInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const [commentCount, setCommentCount] = useState(0)
  const [activities, setActivities] = useState<Activity[]>([])

  // Extended task data
  const [extendedTask, setExtendedTask] = useState<ExtendedProjectTask | null>(null)

  // Real data from Supabase
  const [taskEvents, setTaskEvents] = useState<TaskEvent[]>([])
  const [taskEventsLoading, setTaskEventsLoading] = useState(false)
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([])
  const [agentRunsLoading, setAgentRunsLoading] = useState(false)
  const [childTasks, setChildTasks] = useState<ExtendedProjectTask[]>([])
  const [childTasksLoading, setChildTasksLoading] = useState(false)

  const logActivity = (action: string, detail: ActivityDetail, taskName?: string) => {
    setActivities((prev) => [
      { id: String(Date.now()), user: { name: CURRENT_USER }, action, taskName, timestamp: new Date(), detail },
      ...prev,
    ])
  }

  const onTaskUpdatedRef = useRef(onTaskUpdated)
  onTaskUpdatedRef.current = onTaskUpdated

  const syncTaskState = useCallback((nextTask: ProjectTask) => {
    setExtendedTask(nextTask as ExtendedProjectTask)
    setEditTitle(nextTask.name)
    setEditDescription(nextTask.description || "")
    setEditStatus(nextTask.status)
    setEditStartDate(nextTask.startDate ? format(new Date(nextTask.startDate), "yyyy-MM-dd") : "")
    setEditDueDate(nextTask.dueLabel || "")
    setEditPriority(nextTask.priority || "no-priority")
    setEditAssignee(nextTask.assignee?.name ?? "")
    onTaskUpdatedRef.current?.(nextTask)
  }, [])

  const persistField = async (updates: Parameters<typeof updateTaskService>[1]) => {
    if (!task) return

    const previousTask = (extendedTask ?? task) as ProjectTask
    const nextTask = await updateTaskService(task.id, updates)

    if (!nextTask) {
      syncTaskState(previousTask)
      toast.error("Failed to save task changes")
      return
    }

    syncTaskState(nextTask)
  }

  const taskId = task?.id

  // Initial data fetch
  useEffect(() => {
    if (task && open) {
      setEditTitle(task.name)
      setEditDescription(task.description || "")
      setEditStatus(task.status)
      setEditStartDate(task.startDate ? format(new Date(task.startDate), "yyyy-MM-dd") : "")
      setEditDueDate(task.dueLabel || "")
      setEditPriority(task.priority || "no-priority")
      setEditAssignee(task.assignee?.name ?? "")
      setEditingField(null)
      setActivities([])
      setSubtasks([])

      // Fetch full task data
      fetchTaskById(task.id).then((latest) => {
        if (!latest) return
        syncTaskState(latest)
      })

      fetchSubtasks(task.id).then((items) => setSubtasks(items))

      setTaskEventsLoading(true)
      fetchTaskEvents(task.id).then((events) => { setTaskEvents(events); setTaskEventsLoading(false) })

      setAgentRunsLoading(true)
      fetchRunsByTask(task.id).then((runs) => { setAgentRuns(runs); setAgentRunsLoading(false) })

      setChildTasksLoading(true)
      fetchChildTasks(task.id).then((children) => { setChildTasks(children); setChildTasksLoading(false) })
    }
  }, [taskId, open, syncTaskState])

  // Realtime subscriptions for this task
  const handleRealtimeEvent = useCallback((raw: Record<string, unknown>) => {
    const event: TaskEvent = {
      id: raw.id as string,
      todoId: raw.todo_id as string,
      runId: (raw.run_id as string) || null,
      eventType: raw.event_type as string,
      actorType: raw.actor_type as string,
      actorName: raw.actor_name as string,
      summary: raw.summary as string,
      metadata: (raw.metadata as Record<string, unknown>) || {},
      createdAt: raw.created_at as string,
    }
    setTaskEvents((prev) => [...prev, event])
  }, [])

  const handleRealtimeRun = useCallback((raw: Record<string, unknown>) => {
    const run: AgentRun = {
      id: raw.id as string,
      todoId: (raw.todo_id as string) || null,
      parentRunId: (raw.parent_run_id as string) || null,
      agentName: raw.agent_name as string,
      status: raw.status as AgentRun["status"],
      inputSummary: (raw.input_summary as string) || null,
      outputSummary: (raw.output_summary as string) || null,
      errorMessage: (raw.error_message as string) || null,
      startedAt: raw.started_at as string,
      completedAt: (raw.completed_at as string) || null,
      createdAt: raw.created_at as string,
      updatedAt: raw.updated_at as string,
    }
    setAgentRuns((prev) => {
      const idx = prev.findIndex((r) => r.id === run.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = run; return next }
      return [run, ...prev]
    })
  }, [])

  const handleTodoUpdate = useCallback((raw: Record<string, unknown>) => {
    if (raw.lifecycle_status) {
      setExtendedTask((prev) => prev ? { ...prev, lifecycleStatus: raw.lifecycle_status as ExtendedProjectTask["lifecycleStatus"] } : prev)
    }
  }, [])

  useTaskRealtime(open && taskId ? taskId : null, {
    onTaskEvent: handleRealtimeEvent,
    onAgentRun: handleRealtimeRun,
    onTodoUpdate: handleTodoUpdate,
  })

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const toggleSubtask = async (id: string) => {
    const target = subtasks.find((s) => s.id === id)
    if (target) {
      logActivity(target.done ? "unchecked subtask" : "checked subtask", { type: "checklist", item: target.name, checked: !target.done })
      const next = !target.done
      setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, done: next } : s))
      await updateSubtask(id, { done: next })
    }
  }

  const addSubtask = async () => {
    const name = newSubtaskName.trim()
    if (!name || !task) return
    const created = await createSubtask(task.id, name)
    if (created) {
      setSubtasks((prev) => [...prev, created])
      logActivity("added subtask", { type: "subtask_added", name })
    }
    setNewSubtaskName("")
    setIsAddingSubtask(false)
  }

  const prevTitleRef = useRef("")
  const prevDescRef = useRef("")

  const startEditing = (field: EditingField) => {
    if (field === "title") prevTitleRef.current = editTitle
    if (field === "description") prevDescRef.current = editDescription
    setEditingField(field)
    setTimeout(() => editInputRef.current?.focus(), 0)
  }

  const stopEditing = () => {
    if (editingField === "title" && editTitle.trim() && editTitle !== prevTitleRef.current) {
      logActivity("renamed task", { type: "field_edit", field: "Title", value: editTitle })
      persistField({ name: editTitle.trim() })
    }
    if (editingField === "description" && editDescription !== prevDescRef.current) {
      logActivity("updated description", { type: "field_edit", field: "Description", value: editDescription.slice(0, 60) + (editDescription.length > 60 ? "..." : "") })
      persistField({ description: editDescription })
    }
    setEditingField(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, onSave?: () => void) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSave?.(); stopEditing() }
    if (e.key === "Escape") {
      if (editingField === "title") setEditTitle(prevTitleRef.current)
      if (editingField === "description") setEditDescription(prevDescRef.current)
      setEditingField(null)
    }
  }

  if (!open || !task) return null

  const doneSubtasks = subtasks.filter((s) => s.done).length
  const totalSubtasks = subtasks.length
  const subtaskPercent = totalSubtasks ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0
  const statusOption = STATUS_OPTIONS.find((o) => o.value === editStatus) ?? STATUS_OPTIONS[0]
  const priorityOption = PRIORITY_OPTIONS.find((o) => o.value === editPriority) ?? PRIORITY_OPTIONS[0]

  // Agent messages from task events
  const agentMessages = taskEvents.filter((e) => e.eventType === "agent_message")

  // Child task progress
  const childDone = childTasks.filter((c) => c.lifecycleStatus === "done" || c.status === "done").length

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="w-[90vw] max-w-[calc(100%-2rem)] sm:max-w-[1100px] max-h-[85vh] p-0 gap-0 overflow-hidden rounded-xl !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2">
        <DialogTitle className="sr-only">Task Detail</DialogTitle>
        <DialogDescription className="sr-only">View and edit task details</DialogDescription>
        <div className="flex h-[75vh] max-h-[700px]">
          {/* ── LEFT PANEL ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <div className="flex items-center gap-3">
                <button className="text-muted-foreground hover:text-foreground"><ArrowLineRight className="h-4 w-4" /></button>
                <button className="text-muted-foreground hover:text-foreground"><ArrowsOut className="h-4 w-4" /></button>
                <span className="text-sm text-muted-foreground">Task Detail</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-muted-foreground hover:text-foreground"><ShareNetwork className="h-4 w-4" /></button>
                <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><Eye className="h-4 w-4" /></button>
                <button className="text-muted-foreground hover:text-foreground"><DotsThree className="h-4 w-4" weight="bold" /></button>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {/* Badges row */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {task.category && <Badge variant="muted" className="text-[11px]">{task.category}</Badge>}
                <LifecycleBadge lifecycleStatus={extendedTask?.lifecycleStatus} status={task.status} size="md" />
                {extendedTask?.source && (
                  <Badge variant="outline" className="text-[10px]">{extendedTask.source}</Badge>
                )}
                {extendedTask?.taskType && extendedTask.taskType !== "user_task" && (
                  <Badge variant="secondary" className="text-[10px]">{extendedTask.taskType === "agent_task" ? "Agent Task" : "System Task"}</Badge>
                )}
                {extendedTask?.parentTaskId && (
                  <Badge variant="outline" className="text-[10px] text-blue-500">
                    Child Task {extendedTask.orderIndex !== undefined ? `#${(extendedTask.orderIndex ?? 0) + 1}` : ""}
                  </Badge>
                )}
              </div>

              {/* Editable Title */}
              {editingField === "title" ? (
                <input
                  ref={editInputRef as React.RefObject<HTMLInputElement>}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={stopEditing}
                  onKeyDown={(e) => handleKeyDown(e)}
                  autoFocus
                  className="text-2xl font-bold text-foreground mb-2 w-full bg-transparent outline-none border-b-2 border-primary pb-1"
                />
              ) : (
                <h1
                  onClick={() => { setEditTitle(task.name); startEditing("title") }}
                  className="text-2xl font-bold text-foreground mb-2 cursor-pointer hover:bg-muted/50 rounded-md -mx-1 px-1 transition-colors"
                >
                  {editTitle || task.name}
                </h1>
              )}

              {/* Acceptance Criteria */}
              {extendedTask?.acceptanceCriteria && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 p-4">
                  <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">Acceptance Criteria</h4>
                  <p className="text-sm text-emerald-900 dark:text-emerald-200 whitespace-pre-wrap leading-relaxed">
                    {extendedTask.acceptanceCriteria}
                  </p>
                </div>
              )}

              {/* Editable Description */}
              {editingField === "description" ? (
                <textarea
                  ref={editInputRef as React.RefObject<HTMLTextAreaElement>}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onBlur={stopEditing}
                  onKeyDown={(e) => handleKeyDown(e)}
                  autoFocus
                  rows={3}
                  placeholder="Add a description..."
                  className="text-sm text-foreground leading-relaxed mb-4 w-full bg-transparent outline-none border border-primary/50 rounded-lg p-3 resize-none"
                />
              ) : (
                <p
                  onClick={() => startEditing("description")}
                  className={cn(
                    "text-sm leading-relaxed mb-4 cursor-pointer hover:bg-muted/50 rounded-md -mx-1 px-1 py-1 transition-colors min-h-[2rem]",
                    editDescription ? "text-muted-foreground" : "text-muted-foreground/50 italic"
                  )}
                >
                  {editDescription || "Add a description..."}
                </p>
              )}



              {/* Child Tasks (if parent) */}
              {childTasks.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Child Tasks
                    </h4>
                    <span className="text-xs text-muted-foreground">{childDone}/{childTasks.length} done</span>
                  </div>
                  <div className="space-y-1">
                    {childTasks.map((child, idx) => (
                      <div key={child.id} className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md border border-border/40",
                        child.lifecycleStatus === "in_progress" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : "hover:bg-muted/30"
                      )}>
                        <span className="text-[10px] text-muted-foreground font-mono w-5">{(child.orderIndex ?? idx) + 1}</span>
                        <span className="text-sm text-foreground flex-1 truncate">{child.name}</span>
                        <LifecycleBadge lifecycleStatus={child.lifecycleStatus} status={child.status} />
                        {child.assignee && (
                          <span className="text-[10px] text-muted-foreground">{child.assignee.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata rows */}
              <div className="space-y-4 mb-6">
                {/* Status */}
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-28 shrink-0">Status</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="group flex items-center gap-1.5 cursor-pointer outline-none">
                        <Badge className={cn("text-xs font-medium border-0", statusOption.bg, "hover:opacity-80")}>{statusOption.label}</Badge>
                        <CaretDown className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[160px]">
                      <DropdownMenuLabel>Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {STATUS_OPTIONS.map((opt) => (
                        <DropdownMenuItem
                          key={opt.value}
                          onClick={() => {
                            if (opt.value !== editStatus) {
                              setEditStatus(opt.value)
                              logActivity("changed status", { type: "status_change", from: statusOption.label, to: opt.label })
                              persistField({ status: opt.value as WorkstreamTaskStatus })
                            }
                          }}
                          className="flex items-center justify-between gap-2"
                        >
                          <Badge className={cn("text-xs font-medium border-0", opt.bg)}>{opt.label}</Badge>
                          {editStatus === opt.value && <Check className="h-4 w-4 text-primary" weight="bold" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Assigned to */}
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-28 shrink-0">Assigned to</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="group flex items-center gap-1.5 cursor-pointer outline-none hover:bg-muted/50 rounded-md px-1 py-0.5 -mx-1 transition-colors">
                        {editAssignee ? (
                          <>
                            <Avatar className="h-6 w-6">
                              {getAvatarUrl(editAssignee) && <AvatarImage src={getAvatarUrl(editAssignee)} />}
                              <AvatarFallback className="text-[10px]">{getInitials(editAssignee)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-foreground">{editAssignee}</span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground/50 italic">Unassigned</span>
                        )}
                        <CaretDown className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[180px]">
                      <DropdownMenuLabel>Assign to</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => { if (editAssignee) { logActivity("unassigned task", { type: "field_edit", field: "Assignee", value: "Unassigned" }); setEditAssignee(""); persistField({ assignee: "" }) } }}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-sm text-muted-foreground italic">Unassigned</span>
                        {!editAssignee && <Check className="h-4 w-4 text-primary" weight="bold" />}
                      </DropdownMenuItem>
                      {ASSIGNEE_OPTIONS.map((opt) => (
                        <DropdownMenuItem
                          key={opt.id}
                          onClick={() => {
                            if (opt.name !== editAssignee) {
                              logActivity("assigned task", { type: "field_edit", field: "Assignee", value: opt.name })
                              setEditAssignee(opt.name)
                              persistField({ assignee: opt.name })
                            }
                          }}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              {getAvatarUrl(opt.name) && <AvatarImage src={getAvatarUrl(opt.name)} />}
                              <AvatarFallback className="text-[9px]">{getInitials(opt.name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{opt.name}</span>
                          </div>
                          {editAssignee === opt.name && <Check className="h-4 w-4 text-primary" weight="bold" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Dates */}
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-28 shrink-0">Start date</span>
                  {editingField === "startDate" ? (
                    <input ref={editInputRef as React.RefObject<HTMLInputElement>} type="date" value={editStartDate}
                      onChange={(e) => { setEditStartDate(e.target.value); if (e.target.value) { logActivity("changed start date", { type: "date_change", field: "Start date", value: format(new Date(e.target.value + "T00:00:00"), "MMM d, yyyy") }); persistField({ startDate: new Date(e.target.value + "T00:00:00") }) }; stopEditing() }}
                      onBlur={stopEditing} onKeyDown={(e) => handleKeyDown(e)} autoFocus className="text-sm bg-transparent outline-none border border-primary/50 rounded-md px-2 py-1" />
                  ) : (
                    <button onClick={() => startEditing("startDate")} className="text-sm text-foreground cursor-pointer hover:bg-muted/50 rounded-md px-1 py-0.5 -mx-1 transition-colors">
                      {editStartDate ? format(new Date(editStartDate + "T00:00:00"), "MMMM d, yyyy") : "Set start date"}
                    </button>
                  )}
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-28 shrink-0">Due date</span>
                  {editingField === "dueDate" ? (
                    <input ref={editInputRef as React.RefObject<HTMLInputElement>} type="date" value={editDueDate}
                      onChange={(e) => { setEditDueDate(e.target.value); if (e.target.value) { logActivity("changed due date", { type: "date_change", field: "Due date", value: format(new Date(e.target.value + "T00:00:00"), "MMM d, yyyy") }); persistField({ dueLabel: e.target.value }) }; stopEditing() }}
                      onBlur={stopEditing} onKeyDown={(e) => handleKeyDown(e)} autoFocus className="text-sm bg-transparent outline-none border border-primary/50 rounded-md px-2 py-1" />
                  ) : (
                    <button onClick={() => startEditing("dueDate")} className="text-sm text-foreground cursor-pointer hover:bg-muted/50 rounded-md px-1 py-0.5 -mx-1 transition-colors">
                      {editDueDate ? format(new Date(editDueDate + "T00:00:00"), "MMMM d, yyyy") : "Set due date"}
                    </button>
                  )}
                </div>

                {/* Priority */}
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-28 shrink-0">Priority</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="group flex items-center gap-1.5 cursor-pointer outline-none hover:bg-muted/50 rounded-md px-1 py-0.5 -mx-1 transition-colors">
                        <span className={cn("h-2 w-2 rounded-full", priorityOption.dot)} />
                        <span className="text-sm font-medium capitalize text-foreground">{priorityOption.label}</span>
                        <CaretDown className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[160px]">
                      <DropdownMenuLabel>Priority</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {PRIORITY_OPTIONS.map((opt) => (
                        <DropdownMenuItem key={opt.value} onClick={() => {
                          if (opt.value !== editPriority) { setEditPriority(opt.value); logActivity("changed priority", { type: "priority_change", from: priorityOption.label, to: opt.label }); persistField({ priority: opt.value as ProjectTask["priority"] }) }
                        }} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2"><span className={cn("h-2 w-2 rounded-full", opt.dot)} /><span className="text-sm">{opt.label}</span></div>
                          {editPriority === opt.value && <Check className="h-4 w-4 text-primary" weight="bold" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {task.tag && (
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground w-28 shrink-0">Tag</span>
                    <Badge variant="outline" className="text-xs">{task.tag}</Badge>
                  </div>
                )}

                {/* Workflow info */}
                {task.workflowStage && (
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground w-28 shrink-0">Workflow</span>
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-semibold">{task.workflowStage}</span>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="border-b mb-0">
                <div className="flex gap-6">
                  {(["activities", "runs", "subtasks", "comments"] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={cn(
                        "pb-2.5 text-sm font-medium capitalize border-b-2 transition-colors flex items-center gap-1.5",
                        activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab === "activities" ? "Activity" : tab === "runs" ? "Agent Runs" : tab === "subtasks" ? "Subtasks" : "Comments"}
                      {tab === "comments" && commentCount > 0 && (
                        <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded bg-primary text-primary-foreground text-[10px] font-semibold">{commentCount}</span>
                      )}
                      {tab === "activities" && taskEvents.length > 0 && (
                        <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded bg-muted text-muted-foreground text-[10px] font-semibold">{taskEvents.length}</span>
                      )}
                      {tab === "runs" && agentRuns.length > 0 && (
                        <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded bg-muted text-muted-foreground text-[10px] font-semibold">{agentRuns.length}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Activity Tab (live event stream + agent messages) ── */}
              {activeTab === "activities" && (
                <div className="pt-5 space-y-6">
                  {/* Task provenance */}
                  <div className="space-y-2">
                    {(task.createdByUser || task.createdByAgent) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Created by</span>
                        {task.createdByUser && <span>{task.createdByUser}</span>}
                        {task.createdByUser && task.createdByAgent && <span>via</span>}
                        {task.createdByAgent && <span className="font-medium text-primary">{task.createdByAgent}</span>}
                      </div>
                    )}
                  </div>

                  {/* Live event timeline */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event Timeline</h4>
                      {taskEvents.length > 0 && (
                        <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          LIVE
                        </span>
                      )}
                    </div>
                    {taskEventsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading events...</p>
                    ) : taskEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No events yet. Agent activity will appear here in real time.</p>
                    ) : (
                      <div className="space-y-1">
                        {taskEvents.map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "flex items-start gap-3 px-3 py-2 rounded-md border-l-2 hover:bg-muted/30 transition-colors",
                              EVENT_COLORS[event.eventType] || "border-l-zinc-300",
                            )}
                          >
                            <span className="text-[10px] font-mono text-muted-foreground shrink-0 pt-0.5 w-14">
                              {format(new Date(event.createdAt), "HH:mm:ss")}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs">
                                <span className="font-semibold text-foreground">
                                  {AGENT_EMOJIS[event.actorName] || ""} {event.actorName}
                                </span>
                                <span className="text-muted-foreground ml-1.5">{event.summary}</span>
                              </div>
                              <span className="text-[9px] text-muted-foreground/50">{event.eventType}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Agent Messages (collaboration thread) */}
                  {agentMessages.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Agent Messages</h4>
                      <div className="space-y-3">
                        {agentMessages.map((msg) => (
                          <div key={msg.id} className="flex gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm">
                              {AGENT_EMOJIS[msg.actorName] || "🤖"}
                            </div>
                            <div className="flex-1 min-w-0 rounded-lg bg-muted/50 px-3 py-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-foreground">{msg.actorName}</span>
                                <span className="text-[10px] text-muted-foreground">{formatTimeAgo(msg.createdAt)}</span>
                              </div>
                              <p className="text-xs text-foreground/80">{msg.summary}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Agent Runs Tab ── */}
              {activeTab === "runs" && (
                <div className="pt-5">
                  {agentRunsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading runs...</p>
                  ) : agentRuns.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No agent runs linked to this task yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {agentRuns.map((run) => {
                        const runStatusColors: Record<string, string> = {
                          running: "bg-emerald-100 text-emerald-700",
                          pending: "bg-blue-100 text-blue-700",
                          completed: "bg-zinc-100 text-zinc-600",
                          failed: "bg-red-100 text-red-700",
                          cancelled: "bg-zinc-100 text-zinc-500",
                        }
                        return (
                          <div key={run.id} className="rounded-lg border border-border/50 p-3 hover:bg-muted/20 transition-colors">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{AGENT_EMOJIS[run.agentName] || "🤖"}</span>
                                <span className="text-sm font-medium text-foreground">{run.agentName}</span>
                                <Badge className={cn("text-[10px] border-0", runStatusColors[run.status] || "bg-zinc-100 text-zinc-600")}>
                                  {run.status}
                                </Badge>
                              </div>
                              <code className="text-[10px] font-mono text-muted-foreground">{run.id.slice(0, 8)}</code>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                              <span>Started {format(new Date(run.startedAt), "HH:mm:ss")}</span>
                              <span>Duration: {formatDuration(run.startedAt, run.completedAt)}</span>
                              {run.parentRunId && <span>Parent: {run.parentRunId.slice(0, 8)}</span>}
                            </div>
                            {run.inputSummary && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{run.inputSummary}</p>}
                            {run.outputSummary && <p className="text-xs text-foreground/70 mt-1 line-clamp-2">{run.outputSummary}</p>}
                            {run.errorMessage && <p className="text-xs text-red-500 mt-1">{run.errorMessage}</p>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Subtasks Tab ── */}
              {activeTab === "subtasks" && (
                <div className="pt-5">
                  {totalSubtasks > 0 && (
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-foreground">Checklist</h3>
                      <div className="flex items-center gap-2">
                        <ProgressCircle progress={subtaskPercent} color="var(--chart-2)" size={22} strokeWidth={2.5} />
                        <span className="text-sm text-muted-foreground">{doneSubtasks}/{totalSubtasks}</span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    {subtasks.map((item) => (
                      <div key={item.id} className={cn("group rounded-lg border p-3.5 transition-colors", item.done ? "bg-muted/40 border-border/60" : "bg-background border-border")}>
                        <div className="flex items-start gap-3">
                          <Checkbox checked={item.done} onCheckedChange={() => toggleSubtask(item.id)} className={cn("mt-0.5 h-5 w-5 rounded-md cursor-pointer", item.done && "data-[state=checked]:bg-primary data-[state=checked]:border-primary")} />
                          <div className="flex-1 min-w-0">
                            <span className={cn("text-sm font-medium", item.done ? "line-through text-muted-foreground" : "text-foreground")}>{item.name}</span>
                            {item.note && <div className={cn("mt-2 rounded-md border px-3 py-2 text-xs leading-relaxed", item.done ? "bg-muted/60 border-border/50 text-muted-foreground line-through" : "bg-muted/40 border-border/60 text-muted-foreground")}>{item.note}</div>}
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><button className="p-1 text-muted-foreground hover:text-foreground"><DotsSixVertical className="h-3.5 w-3.5" /></button></div>
                        </div>
                      </div>
                    ))}
                    {isAddingSubtask ? (
                      <div className="rounded-lg border border-primary/50 p-3.5">
                        <div className="flex items-center gap-3">
                          <Checkbox disabled className="mt-0.5 h-5 w-5 rounded-md opacity-40" />
                          <input ref={addInputRef} type="text" value={newSubtaskName} onChange={(e) => setNewSubtaskName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") addSubtask(); if (e.key === "Escape") { setIsAddingSubtask(false); setNewSubtaskName("") } }}
                            autoFocus placeholder="Subtask name..." className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/60" />
                          <button onClick={addSubtask} disabled={!newSubtaskName.trim()} className="px-3 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed">Add</button>
                          <button onClick={() => { setIsAddingSubtask(false); setNewSubtaskName("") }} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setIsAddingSubtask(true)} className="flex items-center gap-2 w-full rounded-lg border border-dashed border-border/80 px-3.5 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                        <Plus className="h-4 w-4" />Add subtask
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Comments Tab ── */}
              {activeTab === "comments" && <CommentsTab taskId={task?.id} onCountChange={setCommentCount} />}
            </div>
          </div>

          {/* ── RIGHT SIDEBAR — Live Agent Activity Stream ── */}
          <div className="w-[360px] shrink-0 border-l flex flex-col bg-muted/20 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Live Agent Activity</h3>
                {taskEvents.length > 0 && (
                  <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {taskEvents.length === 0 && !taskEventsLoading ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No agent activity yet.
                  <br />
                  Events will appear here in real time.
                </p>
              ) : (
                [...taskEvents].reverse().slice(0, 50).map((event) => (
                  <div key={event.id} className="flex items-start gap-2.5 py-1.5">
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 pt-0.5 w-14">
                      {format(new Date(event.createdAt), "HH:mm:ss")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs">
                        <span className="font-semibold text-foreground">{AGENT_EMOJIS[event.actorName] || ""} {event.actorName}</span>
                        <span className="text-muted-foreground ml-1">{event.summary}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
