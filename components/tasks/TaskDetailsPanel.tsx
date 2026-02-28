"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { ProjectTask } from "@/lib/data/project-details"
import { getAvatarUrl } from "@/lib/assets/avatars"
import { X, ArrowLineRight, ArrowsOut, ShareNetwork, Eye, DotsThree, Clock, CheckCircle, Plus, CaretDown, UserPlus, Check } from "@phosphor-icons/react/dist/ssr"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { ProgressCircle } from "@/components/progress-circle"
import { DotsSixVertical } from "@phosphor-icons/react/dist/ssr"
import { CommentsTab } from "@/components/tasks/CommentsTab"

type TaskDetailsPanelProps = {
  task: ProjectTask | null
  open: boolean
  onClose: () => void
}

type ActivityDetail =
  | { type: "checklist"; item: string; checked: boolean }
  | { type: "status_change"; from: string; to: string }
  | { type: "priority_change"; from: string; to: string }
  | { type: "assignee_add"; name: string }
  | { type: "assignee_remove"; name: string }
  | { type: "date_change"; field: string; value: string }
  | { type: "field_edit"; field: string; value: string }
  | { type: "subtask_added"; name: string }
  | { type: "created" }

type Activity = {
  id: string
  user: { name: string }
  action: string
  taskName?: string
  timestamp: Date
  detail: ActivityDetail
}

const CURRENT_USER = "Jason Duong"

const seedActivities: Activity[] = [
  {
    id: "seed-1",
    user: { name: "Rahmadini" },
    action: "created task",
    taskName: "Design System",
    timestamp: new Date("2024-01-07T14:00:00"),
    detail: { type: "created" },
  },
]

// Initial subtasks
const initialSubtasks = [
  { id: "1", name: "Understanding client design brief", done: true, note: "Blocker : The brief from client was not clear so it took time to understand it" },
  { id: "2", name: "Collect moodboards about KPI programs", done: true },
  { id: "3", name: "Meeting & Mind Mapping with Tyler", done: false, note: "Note : Some employees have different KPI cases" },
  { id: "4", name: "Wireframing and Creating alternative versions", done: false },
]

// All available team members
const ALL_MEMBERS = [
  { name: "Dea Ananda" },
  { name: "Akmal Nasrulloh" },
  { name: "Aldyyy" },
  { name: "Rahmadini" },
  { name: "Jason Duong" },
]

// Initial assigned members
const initialAssignees = ["Dea Ananda", "Akmal Nasrulloh", "Aldyyy"]

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

function getStatusBadgeColor(label: string): string {
  switch (label) {
    case "To Do": return "bg-gray-100 text-gray-600 hover:bg-gray-100"
    case "In Progress": return "bg-amber-100 text-amber-700 hover:bg-amber-100"
    case "Done": return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
    default: return "bg-gray-100 text-gray-600 hover:bg-gray-100"
  }
}

type EditingField = "title" | "description" | "startDate" | "dueDate" | null

export function TaskDetailsPanel({ task, open, onClose }: TaskDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<"subtasks" | "comments" | "activities">("subtasks")
  const [subtasks, setSubtasks] = useState(initialSubtasks)
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
  const [editAssignees, setEditAssignees] = useState<string[]>(initialAssignees)
  const editInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // Comments count for badge
  const [commentCount, setCommentCount] = useState(3)

  // Real-time activities
  const [activities, setActivities] = useState<Activity[]>(seedActivities)

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

  // Sync edit state when a different task is selected or panel re-opens
  const taskId = task?.id
  useEffect(() => {
    if (task) {
      setEditTitle(task.name)
      setEditDescription(task.description || "")
      setEditStatus(task.status)
      setEditStartDate(task.startDate ? format(new Date(task.startDate), "yyyy-MM-dd") : "")
      setEditDueDate("")
      setEditPriority(task.priority || "no-priority")
      setEditingField(null)
      setActivities(seedActivities)
    }
  }, [taskId, open]) // eslint-disable-line react-hooks/exhaustive-deps

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const toggleSubtask = (id: string) => {
    const target = subtasks.find((s) => s.id === id)
    if (target) {
      logActivity(
        target.done ? "unchecked subtask" : "checked subtask",
        { type: "checklist", item: target.name, checked: !target.done }
      )
    }
    setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, done: !s.done } : s))
  }

  const addSubtask = () => {
    const name = newSubtaskName.trim()
    if (!name) return
    setSubtasks((prev) => [...prev, { id: String(Date.now()), name, done: false }])
    logActivity("added subtask", { type: "subtask_added", name })
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
    }
    if (editingField === "description" && editDescription !== prevDescRef.current) {
      logActivity("updated description", { type: "field_edit", field: "Description", value: editDescription.slice(0, 60) + (editDescription.length > 60 ? "..." : "") })
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

  const progress = 60
  const statusOption = STATUS_OPTIONS.find((o) => o.value === editStatus) ?? STATUS_OPTIONS[0]
  const priorityOption = PRIORITY_OPTIONS.find((o) => o.value === editPriority) ?? PRIORITY_OPTIONS[0]

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="w-[90vw] max-w-[calc(100%-2rem)] sm:max-w-[1100px] p-0 gap-0 overflow-hidden rounded-xl">
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
                  <span className="text-xs">6</span>
                </button>
                <button className="text-muted-foreground hover:text-foreground"><DotsThree className="h-4 w-4" weight="bold" /></button>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
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
                  <div className="flex items-center gap-2 flex-wrap">
                    {editAssignees.map((name) => (
                      <div key={name} className="flex items-center gap-1.5">
                        <Avatar className="h-6 w-6">
                          {getAvatarUrl(name) && <AvatarImage src={getAvatarUrl(name)} />}
                          <AvatarFallback className="text-[10px]">{getInitials(name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">{name}</span>
                      </div>
                    ))}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center justify-center h-6 w-6 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors outline-none">
                          <Plus className="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-[200px]">
                        <DropdownMenuLabel>Assign members</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {ALL_MEMBERS.map((member) => {
                          const isSelected = editAssignees.includes(member.name)
                          return (
                            <DropdownMenuCheckboxItem
                              key={member.name}
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                setEditAssignees((prev) =>
                                  checked
                                    ? [...prev, member.name]
                                    : prev.filter((n) => n !== member.name)
                                )
                                logActivity(
                                  checked ? "assigned" : "unassigned",
                                  checked
                                    ? { type: "assignee_add", name: member.name }
                                    : { type: "assignee_remove", name: member.name }
                                )
                              }}
                            >
                              <Avatar className="h-5 w-5 mr-1.5">
                                {getAvatarUrl(member.name) && <AvatarImage src={getAvatarUrl(member.name)} />}
                                <AvatarFallback className="text-[8px]">{getInitials(member.name)}</AvatarFallback>
                              </Avatar>
                              {member.name}
                            </DropdownMenuCheckboxItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
                      {editStartDate ? format(new Date(editStartDate + "T00:00:00"), "MMMM d, yyyy") : task.startDate ? format(new Date(task.startDate), "MMMM d, yyyy") : "Set start date"}
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
                      {editDueDate ? format(new Date(editDueDate + "T00:00:00"), "MMMM d, yyyy") : task.dueLabel || "Set due date"}
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
                      {tab === "comments" && (
                        <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded bg-primary text-primary-foreground text-[10px] font-semibold">{commentCount}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              {activeTab === "subtasks" && (() => {
                const doneCount = subtasks.filter((s) => s.done).length
                const totalCount = subtasks.length
                const percent = totalCount ? Math.round((doneCount / totalCount) * 100) : 0
                return (
                  <div className="pt-5">
                    {/* Subtask group header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-foreground">Our Design Process</h3>
                      <div className="flex items-center gap-2">
                        <ProgressCircle progress={percent} color="var(--chart-2)" size={22} strokeWidth={2.5} />
                        <span className="text-sm text-muted-foreground">{doneCount}/{totalCount}</span>
                      </div>
                    </div>

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
                              {"note" in item && item.note && (
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
                              <button className="p-1 text-muted-foreground hover:text-foreground"><Plus className="h-3.5 w-3.5" /></button>
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
                )
              })()}

              {activeTab === "comments" && (
                <CommentsTab onCountChange={setCommentCount} />
              )}

              {activeTab === "activities" && (
                <div className="pt-5">
                  <p className="text-sm text-muted-foreground">No activities yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="w-[360px] shrink-0 border-l flex flex-col bg-muted/20 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Project Stats */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4">Project Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">Time Remaining</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">4d</span>
                  </div>
                  <div className="text-xs text-muted-foreground pl-6">Activate reminder</div>

                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 flex items-center justify-center shrink-0">
                          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                        </div>
                        <span className="text-xs text-muted-foreground">Progress</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{progress}%</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-blue-600 rounded-full relative"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-4 w-4 rounded-full bg-blue-600 border-2 border-white dark:border-background" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activities — real-time feed */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Activities</h3>
                </div>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-2.5">
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
                        {activity.detail.type === "assignee_add" && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Avatar className="h-4 w-4">
                              {getAvatarUrl(activity.detail.name) && <AvatarImage src={getAvatarUrl(activity.detail.name)} />}
                              <AvatarFallback className="text-[7px]">{getInitials(activity.detail.name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-foreground">{activity.detail.name}</span>
                          </div>
                        )}
                        {activity.detail.type === "assignee_remove" && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Avatar className="h-4 w-4 opacity-50">
                              {getAvatarUrl(activity.detail.name) && <AvatarImage src={getAvatarUrl(activity.detail.name)} />}
                              <AvatarFallback className="text-[7px]">{getInitials(activity.detail.name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground line-through">{activity.detail.name}</span>
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
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
