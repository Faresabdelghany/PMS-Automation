"use client"

import { useEffect, useRef, useState } from "react"
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
import { fetchTaskById, updateTask as updateTaskService } from "@/lib/services/tasks"
import { fetchAgentLogsByTask, type AgentLog } from "@/lib/services/agents"
import { fetchSubtasks, createSubtask, updateSubtask } from "@/lib/services/subtasks"
import { fetchTaskEvents, type TaskEvent } from "@/lib/services/task-events"

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

function getStatusBadgeColor(label: string): string {
  switch (label) {
    case "To Do": return "bg-gray-100 text-gray-600 hover:bg-gray-100"
    case "In Progress": return "bg-amber-100 text-amber-700 hover:bg-amber-100"
    case "Done": return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
    default: return "bg-gray-100 text-gray-600 hover:bg-gray-100"
  }
}

type EditingField = "title" | "description" | "startDate" | "dueDate" | null

// Subtask type (local-only for now)
type Subtask = { id: string; name: string; done: boolean; note?: string }

export function TaskDetailsPanel({ task, open, onClose, onTaskUpdated }: TaskDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<"subtasks" | "comments" | "activities">("subtasks")
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [newSubtaskName, setNewSubtaskName] = useState("")
  const addInputRef = useRef<HTMLInputElement>(null)

  // Inline editing state
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

  // Session activities (local changes during this session)
  const [activities, setActivities] = useState<Activity[]>([])

  // Real agent logs from Supabase (persisted)
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([])
  const [agentLogsLoading, setAgentLogsLoading] = useState(false)

  // Real task events timeline from Supabase
  const [taskEvents, setTaskEvents] = useState<TaskEvent[]>([])
  const [taskEventsLoading, setTaskEventsLoading] = useState(false)

  const logActivity = (action: string, detail: ActivityDetail, taskName?: string) => {
    setActivities((prev) => [
      {
        id: String(Date.now()),
        user: { name: CURRENT_USER },
        action,
        taskName,
        timestamp: new Date(),
        detail,
      },
      ...prev,
    ])
  }

  // Helper to persist a field change and update parent state
  const persistField = (updates: Parameters<typeof updateTaskService>[1]) => {
    if (!task) return
    // Fire-and-forget DB update
    updateTaskService(task.id, updates)
    // Notify parent with updated task object
    if (onTaskUpdated) {
      const updated = { ...task }
      if (updates.name !== undefined) updated.name = updates.name
      if (updates.status !== undefined) updated.status = updates.status
      if (updates.priority !== undefined) updated.priority = updates.priority
      if (updates.description !== undefined) updated.description = updates.description
      if (updates.startDate !== undefined) updated.startDate = updates.startDate ?? undefined
      if (updates.dueLabel !== undefined) updated.dueLabel = updates.dueLabel
      if (updates.assignee !== undefined) {
        updated.assignee = updates.assignee
          ? { id: updates.assignee.toLowerCase().replace(/\s+/g, "-"), name: updates.assignee, avatarUrl: getAvatarUrl(updates.assignee) }
          : undefined
      }
      onTaskUpdated(updated)
    }
  }

  // Sync edit state when a different task is selected or panel re-opens
  const taskId = task?.id
  useEffect(() => {
    if (task) {
      setEditTitle(task.name)
      setEditDescription(task.description || "")
      setEditStatus(task.status)
      setEditStartDate(task.startDate ? format(new Date(task.startDate), "yyyy-MM-dd") : "")
      setEditDueDate(task.dueLabel || "")
      setEditPriority(task.priority || "no-priority")
      setEditAssignee(task.assignee?.name ?? "")

      fetchTaskById(task.id).then((latest) => {
        if (!latest) return
        setEditTitle(latest.name)
        setEditDescription(latest.description || "")
        setEditStatus(latest.status)
        setEditStartDate(latest.startDate ? format(new Date(latest.startDate), "yyyy-MM-dd") : "")
        setEditDueDate(latest.dueLabel || "")
        setEditPriority(latest.priority || "no-priority")
        setEditAssignee(latest.assignee?.name ?? "")
        onTaskUpdated?.(latest)
      })
      setEditingField(null)
      setActivities([])
      setSubtasks([])
      setTaskEvents([])

      // Fetch subtasks + timeline + debug logs
      fetchSubtasks(task.id).then((items) => setSubtasks(items))

      setTaskEventsLoading(true)
      fetchTaskEvents(task.id).then((events) => {
        setTaskEvents(events)
        setTaskEventsLoading(false)
      })

      setAgentLogsLoading(true)
      fetchAgentLogsByTask(task.id).then((logs) => {
        setAgentLogs(logs)
        setAgentLogsLoading(false)
      })
    }
  }, [taskId, open]) // eslint-disable-line react-hooks/exhaustive-deps

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const toggleSubtask = async (id: string) => {
    const target = subtasks.find((s) => s.id === id)
    if (target) {
      logActivity(
        target.done ? "unchecked subtask" : "checked subtask",
        { type: "checklist", item: target.name, checked: !target.done }
      )
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
                <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  <Eye className="h-4 w-4" />
                </button>
                <button className="text-muted-foreground hover:text-foreground"><DotsThree className="h-4 w-4" weight="bold" /></button>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {/* Category badge */}
              {task.category && (
                <Badge variant="muted" className="text-[11px] mb-3">{task.category}</Badge>
              )}

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
                  className="text-sm text-foreground leading-relaxed mb-6 w-full bg-transparent outline-none border border-primary/50 rounded-lg p-3 resize-none"
                />
              ) : (
                <p
                  onClick={() => startEditing("description")}
                  className={cn(
                    "text-sm leading-relaxed mb-6 cursor-pointer hover:bg-muted/50 rounded-md -mx-1 px-1 py-1 transition-colors min-h-[2rem]",
                    editDescription ? "text-muted-foreground" : "text-muted-foreground/50 italic"
                  )}
                >
                  {editDescription || "Add a description..."}
                </p>
              )}

              {/* Metadata rows */}
              <div className="space-y-4 mb-6">
                {/* Status - Dropdown */}
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-28 shrink-0">Status</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="group flex items-center gap-1.5 cursor-pointer outline-none">
                        <Badge className={cn("text-xs font-medium border-0", statusOption.bg, "hover:opacity-80")}>
                          {statusOption.label}
                        </Badge>
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
                              const fromLabel = statusOption.label
                              setEditStatus(opt.value)
                              logActivity("changed status", { type: "status_change", from: fromLabel, to: opt.label })
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

                {/* Assigned to - Dropdown */}
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
                        onClick={() => {
                          if (editAssignee) {
                            logActivity("unassigned task", { type: "field_edit", field: "Assignee", value: "Unassigned" })
                            setEditAssignee("")
                            persistField({ assignee: "" })
                          }
                        }}
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

                {/* Start date */}
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-28 shrink-0">Start date</span>
                  {editingField === "startDate" ? (
                    <input
                      ref={editInputRef as React.RefObject<HTMLInputElement>}
                      type="date"
                      value={editStartDate}
                      onChange={(e) => {
                        setEditStartDate(e.target.value)
                        if (e.target.value) {
                          logActivity("changed start date", { type: "date_change", field: "Start date", value: format(new Date(e.target.value + "T00:00:00"), "MMM d, yyyy") })
                          persistField({ startDate: new Date(e.target.value + "T00:00:00") })
                        }
                        stopEditing()
                      }}
                      onBlur={stopEditing}
                      onKeyDown={(e) => handleKeyDown(e)}
                      autoFocus
                      className="text-sm bg-transparent outline-none border border-primary/50 rounded-md px-2 py-1"
                    />
                  ) : (
                    <button
                      onClick={() => startEditing("startDate")}
                      className="text-sm text-foreground cursor-pointer hover:bg-muted/50 rounded-md px-1 py-0.5 -mx-1 transition-colors"
                    >
                      {editStartDate ? format(new Date(editStartDate + "T00:00:00"), "MMMM d, yyyy") : "Set start date"}
                    </button>
                  )}
                </div>

                {/* Due date */}
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-28 shrink-0">Due date</span>
                  {editingField === "dueDate" ? (
                    <input
                      ref={editInputRef as React.RefObject<HTMLInputElement>}
                      type="date"
                      value={editDueDate}
                      onChange={(e) => {
                        setEditDueDate(e.target.value)
                        if (e.target.value) {
                          logActivity("changed due date", { type: "date_change", field: "Due date", value: format(new Date(e.target.value + "T00:00:00"), "MMM d, yyyy") })
                          persistField({ dueLabel: e.target.value })
                        }
                        stopEditing()
                      }}
                      onBlur={stopEditing}
                      onKeyDown={(e) => handleKeyDown(e)}
                      autoFocus
                      className="text-sm bg-transparent outline-none border border-primary/50 rounded-md px-2 py-1"
                    />
                  ) : (
                    <button
                      onClick={() => startEditing("dueDate")}
                      className="text-sm text-foreground cursor-pointer hover:bg-muted/50 rounded-md px-1 py-0.5 -mx-1 transition-colors"
                    >
                      {editDueDate ? format(new Date(editDueDate + "T00:00:00"), "MMMM d, yyyy") : "Set due date"}
                    </button>
                  )}
                </div>

                {/* Priority - Dropdown */}
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-28 shrink-0">Priority</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="group flex items-center gap-1.5 cursor-pointer outline-none hover:bg-muted/50 rounded-md px-1 py-0.5 -mx-1 transition-colors">
                        <span className={cn("h-2 w-2 rounded-full", priorityOption.dot)} />
                        <span className="text-sm font-medium capitalize text-foreground">
                          {priorityOption.label}
                        </span>
                        <CaretDown className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[160px]">
                      <DropdownMenuLabel>Priority</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {PRIORITY_OPTIONS.map((opt) => (
                        <DropdownMenuItem
                          key={opt.value}
                          onClick={() => {
                            if (opt.value !== editPriority) {
                              const fromLabel = priorityOption.label
                              setEditPriority(opt.value)
                              logActivity("changed priority", { type: "priority_change", from: fromLabel, to: opt.label })
                              persistField({ priority: opt.value as ProjectTask["priority"] })
                            }
                          }}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn("h-2 w-2 rounded-full", opt.dot)} />
                            <span className="text-sm">{opt.label}</span>
                          </div>
                          {editPriority === opt.value && <Check className="h-4 w-4 text-primary" weight="bold" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Tag */}
                {task.tag && (
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground w-28 shrink-0">Tag</span>
                    <Badge variant="outline" className="text-xs">{task.tag}</Badge>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="border-b mb-0">
                <div className="flex gap-6">
                  {(["subtasks", "comments", "activities"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "pb-2.5 text-sm font-medium capitalize border-b-2 transition-colors flex items-center gap-1.5",
                        activeTab === tab
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab === "subtasks" ? "Subtasks" : tab === "comments" ? "Comments" : "Activities"}
                      {tab === "comments" && commentCount > 0 && (
                        <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded bg-primary text-primary-foreground text-[10px] font-semibold">{commentCount}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              {activeTab === "subtasks" && (
                <div className="pt-5">
                  {/* Subtask progress header */}
                  {totalSubtasks > 0 && (
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-foreground">Checklist</h3>
                      <div className="flex items-center gap-2">
                        <ProgressCircle progress={subtaskPercent} color="var(--chart-2)" size={22} strokeWidth={2.5} />
                        <span className="text-sm text-muted-foreground">{doneSubtasks}/{totalSubtasks}</span>
                      </div>
                    </div>
                  )}

                  {/* Subtask cards */}
                  <div className="space-y-3">
                    {subtasks.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "group rounded-lg border p-3.5 transition-colors",
                          item.done ? "bg-muted/40 border-border/60" : "bg-background border-border"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={item.done}
                            onCheckedChange={() => toggleSubtask(item.id)}
                            className={cn(
                              "mt-0.5 h-5 w-5 rounded-md cursor-pointer",
                              item.done && "data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <span className={cn(
                              "text-sm font-medium",
                              item.done ? "line-through text-muted-foreground" : "text-foreground"
                            )}>
                              {item.name}
                            </span>
                            {item.note && (
                              <div className={cn(
                                "mt-2 rounded-md border px-3 py-2 text-xs leading-relaxed",
                                item.done
                                  ? "bg-muted/60 border-border/50 text-muted-foreground line-through"
                                  : "bg-muted/40 border-border/60 text-muted-foreground"
                              )}>
                                {item.note}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 text-muted-foreground hover:text-foreground"><DotsSixVertical className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add subtask */}
                    {isAddingSubtask ? (
                      <div className="rounded-lg border border-primary/50 p-3.5">
                        <div className="flex items-center gap-3">
                          <Checkbox disabled className="mt-0.5 h-5 w-5 rounded-md opacity-40" />
                          <input
                            ref={addInputRef}
                            type="text"
                            value={newSubtaskName}
                            onChange={(e) => setNewSubtaskName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") addSubtask()
                              if (e.key === "Escape") { setIsAddingSubtask(false); setNewSubtaskName("") }
                            }}
                            autoFocus
                            placeholder="Subtask name..."
                            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/60"
                          />
                          <button
                            onClick={addSubtask}
                            disabled={!newSubtaskName.trim()}
                            className="px-3 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => { setIsAddingSubtask(false); setNewSubtaskName("") }}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsAddingSubtask(true)}
                        className="flex items-center gap-2 w-full rounded-lg border border-dashed border-border/80 px-3.5 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add subtask
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "comments" && (
                <CommentsTab taskId={task?.id} onCountChange={setCommentCount} />
              )}

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
                    {(task.updatedByUser || task.updatedByAgent) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Updated by</span>
                        {task.updatedByUser && <span>{task.updatedByUser}</span>}
                        {task.updatedByUser && task.updatedByAgent && <span>via</span>}
                        {task.updatedByAgent && <span className="font-medium text-primary">{task.updatedByAgent}</span>}
                        {task.lastUpdateSummary && (
                          <span className="text-xs italic ml-1">— {task.lastUpdateSummary}</span>
                        )}
                      </div>
                    )}
                    {task.workflowStage && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Workflow stage</span>
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-semibold">{task.workflowStage}</span>
                      </div>
                    )}
                  </div>

                  {/* Timeline events (persisted from task_events) */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Timeline</h4>
                    {taskEventsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading timeline...</p>
                    ) : taskEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No timeline events linked to this task yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {taskEvents.map((event) => (
                          <TaskEventItem key={event.id} event={event} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Session activities (local changes) */}
                  {activities.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Session Changes (Local Only)</h4>
                      <div className="space-y-4">
                        {activities.map((activity) => (
                          <ActivityItem key={activity.id} activity={activity} getInitials={getInitials} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Agent logs (persisted from Supabase) */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Debug / Agent Logs</h4>
                    {agentLogsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading debug logs...</p>
                    ) : agentLogs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No debug logs linked to this task yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {agentLogs.map((log) => (
                          <AgentLogItem key={log.id} log={log} getInitials={getInitials} />
                        ))}
                      </div>
                    )}
                  </div>

                  {activities.length === 0 && taskEvents.length === 0 && agentLogs.length === 0 && !agentLogsLoading && !taskEventsLoading && (
                    <p className="text-sm text-muted-foreground">No activities yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="w-[360px] shrink-0 border-l flex flex-col bg-muted/20 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Session Activities */}
              {activities.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Recent Changes</h3>
                  </div>
                  <div className="space-y-4">
                    {activities.slice(0, 5).map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} getInitials={getInitials} />
                    ))}
                  </div>
                </div>
              )}

              {/* Agent Activity (sidebar) */}
              {agentLogs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Agent Activity</h3>
                  </div>
                  <div className="space-y-3">
                    {agentLogs.slice(0, 3).map((log) => (
                      <AgentLogItem key={log.id} log={log} getInitials={getInitials} compact />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TaskEventItem({ event }: { event: TaskEvent }) {
  const actorTone = event.actorType === "agent" ? "text-primary" : "text-foreground"
  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
        {event.actorType === "agent" ? "🤖" : "👤"}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="text-xs leading-relaxed">
          <span className={cn("font-semibold", actorTone)}>{event.actorName}</span>
          <span className="text-muted-foreground ml-1">{event.summary}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{format(new Date(event.createdAt), "MMM d, yyyy")} at {format(new Date(event.createdAt), "hh:mm a")}</span>
          <span className="opacity-50">· {event.eventType}</span>
          {event.runId && <span className="opacity-50">· run {event.runId.slice(0, 8)}</span>}
        </div>
      </div>
    </div>
  )
}

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

function AgentLogItem({ log, getInitials, compact }: { log: AgentLog; getInitials: (name: string) => string; compact?: boolean }) {
  const emoji = AGENT_EMOJIS[log.agentName] ?? "🤖"
  const statusColor = log.status === "completed" ? "text-emerald-500" : "text-red-500"
  const statusLabel = log.status === "completed" ? "Completed" : "Failed"

  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm">
        {emoji}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="text-xs leading-relaxed">
          <span className="font-semibold text-foreground">{log.agentName}</span>
          <span className={cn("ml-1.5 text-[10px] font-medium", statusColor)}>{statusLabel}</span>
        </div>
        {!compact && (
          <p className="text-xs text-muted-foreground line-clamp-2">{log.taskDescription}</p>
        )}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{format(new Date(log.createdAt), "MMM d, yyyy")} at {format(new Date(log.createdAt), "hh:mm a")}</span>
          {!compact && <span className="opacity-50">· {log.modelUsed}</span>}
        </div>
      </div>
    </div>
  )
}

function ActivityItem({ activity, getInitials }: { activity: Activity; getInitials: (name: string) => string }) {
  return (
    <div className="flex gap-2.5">
      <Avatar className="h-7 w-7 shrink-0">
        {getAvatarUrl(activity.user.name) && <AvatarImage src={getAvatarUrl(activity.user.name)} />}
        <AvatarFallback className="text-[9px]">{getInitials(activity.user.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="text-xs leading-relaxed">
          <span className="font-semibold text-foreground">{activity.user.name}</span>
          <span className="text-muted-foreground"> {activity.action}</span>
          {activity.taskName && (
            <span className="font-semibold text-foreground"> {activity.taskName}</span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {format(activity.timestamp, "MMM d, yyyy")} at {format(activity.timestamp, "hh:mm a")}
        </div>
        {activity.detail.type === "checklist" && (
          <div className="flex items-center gap-1.5 mt-1">
            <CheckCircle className={cn("h-4 w-4", activity.detail.checked ? "text-green-600" : "text-muted-foreground")} weight={activity.detail.checked ? "fill" : "regular"} />
            <span className="text-xs text-foreground">{activity.detail.item}</span>
          </div>
        )}
        {activity.detail.type === "status_change" && (
          <div className="flex items-center gap-2 mt-1">
            <Badge className={cn("border-0 text-[10px] h-5 px-2 font-medium", getStatusBadgeColor(activity.detail.from))}>
              {activity.detail.from}
            </Badge>
            <span className="text-muted-foreground text-xs">→</span>
            <Badge className={cn("border-0 text-[10px] h-5 px-2 font-medium", getStatusBadgeColor(activity.detail.to))}>
              {activity.detail.to}
            </Badge>
          </div>
        )}
        {activity.detail.type === "priority_change" && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{activity.detail.from}</span>
            <span className="text-muted-foreground text-xs">→</span>
            <span className="text-xs font-medium text-foreground">{activity.detail.to}</span>
          </div>
        )}
        {activity.detail.type === "date_change" && (
          <div className="text-xs text-foreground mt-1">
            {activity.detail.field}: <span className="font-medium">{activity.detail.value}</span>
          </div>
        )}
        {activity.detail.type === "subtask_added" && (
          <div className="flex items-center gap-1.5 mt-1">
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-foreground">{activity.detail.name}</span>
          </div>
        )}
        {activity.detail.type === "field_edit" && (
          <div className="text-xs text-foreground mt-1">
            {activity.detail.field}: <span className="font-medium">{activity.detail.value}</span>
          </div>
        )}
      </div>
    </div>
  )
}
