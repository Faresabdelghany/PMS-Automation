"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Plus, Sparkle } from "@phosphor-icons/react/dist/ssr"
import {
  DndContext,
  type DragEndEvent,
  closestCenter,
} from "@dnd-kit/core"
import {
  arrayMove,
} from "@dnd-kit/sortable"

import type { ProjectTask, WorkstreamTaskStatus } from "@/lib/data/project-details"
import type { FilterCounts } from "@/lib/data/projects"
import { DEFAULT_VIEW_OPTIONS, type FilterChip as FilterChipType, type ViewOptions } from "@/lib/view-options"
import {
  fetchUserTasks,
  updateTask as updateTaskService,
  reorderTasks as reorderTasksService,
} from "@/lib/services/tasks"

const TaskWeekBoardView = dynamic(
  () => import("@/components/tasks/TaskWeekBoardView").then(m => m.TaskWeekBoardView),
  { ssr: false }
)
const TaskKanbanView = dynamic(
  () => import("@/components/tasks/TaskKanbanView").then(m => m.TaskKanbanView),
  { ssr: false }
)
import {
  type CategoryTaskGroup,
  ProjectTaskListView,
  filterTasksByChips,
  computeTaskFilterCounts,
  deriveTaskMemberOptions,
  deriveTaskPriorityOptions,
  deriveTaskTagOptions,
} from "@/components/tasks/task-helpers"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { FilterPopover, type StatusOption } from "@/components/filter-popover"
import { ChipOverflow } from "@/components/chip-overflow"
import { ViewOptionsPopover } from "@/components/view-options-popover"
import { TaskQuickCreateModal, type CreateTaskContext } from "@/components/tasks/TaskQuickCreateModal"

const TaskDetailsPanel = dynamic(
  () => import("@/components/tasks/TaskDetailsPanel").then(m => m.TaskDetailsPanel),
  { ssr: false }
)

const TASK_STATUS_OPTIONS: StatusOption[] = [
  { id: "todo", label: "To Do", color: "oklch(0.65 0.15 250)" },
  { id: "in-progress", label: "In Progress", color: "oklch(0.75 0.15 80)" },
  { id: "done", label: "Done", color: "oklch(0.72 0.19 150)" },
]

function groupTasksByCategory(tasks: ProjectTask[]): CategoryTaskGroup[] {
  const map = new Map<string, ProjectTask[]>()

  for (const task of tasks) {
    const cat = task.category ?? "Uncategorized"
    const existing = map.get(cat)
    if (existing) {
      existing.push(task)
    } else {
      map.set(cat, [task])
    }
  }

  return Array.from(map.entries()).map(([name, tasks]) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    tasks,
  }))
}

export function MyTasksPage() {
  const [allTasks, setAllTasks] = useState<ProjectTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [filters, setFilters] = useState<FilterChipType[]>([])
  const [viewOptions, setViewOptions] = useState<ViewOptions>(DEFAULT_VIEW_OPTIONS)

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [createContext, setCreateContext] = useState<CreateTaskContext | undefined>(undefined)
  const [editingTask, setEditingTask] = useState<ProjectTask | undefined>(undefined)
  const [detailTask, setDetailTask] = useState<ProjectTask | null>(null)

  // Fetch user-facing tasks from Supabase on mount
  useEffect(() => {
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const load = async () => {
      setIsLoading(true)
      setLoadError(null)

      timeoutId = setTimeout(() => {
        if (!cancelled) {
          setLoadError("Tasks are taking longer than expected to load. Please refresh.")
          setIsLoading(false)
        }
      }, 15000)

      try {
        const tasks = await fetchUserTasks()
        if (!cancelled) {
          setAllTasks(tasks)
          setIsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load tasks")
          setAllTasks([])
          setIsLoading(false)
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
      }
    }

    load()

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const groups = useMemo(() => groupTasksByCategory(allTasks), [allTasks])

  const counts = useMemo<FilterCounts>(() => {
    return computeTaskFilterCounts(allTasks)
  }, [allTasks])

  const taskMemberOptions = useMemo(() => deriveTaskMemberOptions(allTasks), [allTasks])
  const taskPriorityOptions = useMemo(() => deriveTaskPriorityOptions(allTasks), [allTasks])
  const taskTagOptions = useMemo(() => deriveTaskTagOptions(allTasks), [allTasks])

  const visibleGroups = useMemo<CategoryTaskGroup[]>(() => {
    if (!filters.length) return groups

    return groups
      .map((group) => ({
        ...group,
        tasks: filterTasksByChips(group.tasks, filters),
      }))
      .filter((group) => group.tasks.length > 0)
  }, [groups, filters])

  const allVisibleTasks = useMemo<ProjectTask[]>(() => {
    return visibleGroups.flatMap((group) => group.tasks)
  }, [visibleGroups])

  const openCreateTask = (context?: CreateTaskContext) => {
    setEditingTask(undefined)
    setCreateContext(context)
    setIsCreateTaskOpen(true)
  }

  const handleTaskCreated = useCallback((task: ProjectTask) => {
    setAllTasks((prev) => [...prev, task])
  }, [])

  const toggleTask = useCallback((taskId: string) => {
    setAllTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task
        const newStatus = task.status === "done" ? "todo" : "done"
        // Fire-and-forget update to DB
        updateTaskService(taskId, { status: newStatus })
        return { ...task, status: newStatus }
      }),
    )
  }, [])

  const changeTaskTag = useCallback((taskId: string, tagLabel?: string) => {
    setAllTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task
        updateTaskService(taskId, { tag: tagLabel ?? "" })
        return { ...task, tag: tagLabel }
      }),
    )
  }, [])

  const changeTaskStatus = useCallback((taskId: string, newStatus: WorkstreamTaskStatus) => {
    setAllTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task
        updateTaskService(taskId, { status: newStatus })
        return { ...task, status: newStatus }
      }),
    )
  }, [])

  const moveTaskDate = useCallback((taskId: string, newDate: Date) => {
    setAllTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task
        updateTaskService(taskId, { startDate: newDate })
        return { ...task, startDate: newDate }
      }),
    )
  }, [])

  const handleTaskUpdated = useCallback((updated: ProjectTask) => {
    setAllTasks((prev) =>
      prev.map((task) => (task.id === updated.id ? updated : task)),
    )
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    setAllTasks((prev) => {
      const activeIndex = prev.findIndex((t) => t.id === active.id)
      const overIndex = prev.findIndex((t) => t.id === over.id)

      if (activeIndex === -1 || overIndex === -1) return prev

      // Only reorder within same category
      if (prev[activeIndex].category !== prev[overIndex].category) return prev

      const reordered = arrayMove(prev, activeIndex, overIndex)

      // Fire-and-forget reorder to DB for tasks in this category
      const cat = prev[activeIndex].category ?? "Uncategorized"
      const categoryTaskIds = reordered
        .filter((t) => (t.category ?? "Uncategorized") === cat)
        .map((t) => t.id)
      reorderTasksService(categoryTaskIds)

      return reordered
    })
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col min-h-0 bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/70">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
            <p className="text-base font-medium text-foreground">Tasks</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-1 flex-col min-h-0 bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/70">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
            <p className="text-base font-medium text-foreground">Tasks</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-foreground">Couldn’t load tasks</p>
            <p className="text-sm text-muted-foreground">{loadError}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!visibleGroups.length) {
    return (
      <div className="flex flex-1 flex-col min-h-0 bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/70">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
            <p className="text-base font-medium text-foreground">Tasks</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openCreateTask()}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Task
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">No user-facing tasks yet</p>
            <Button size="sm" onClick={() => openCreateTask()}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create your first task
            </Button>
          </div>
        </div>

        <TaskQuickCreateModal
          open={isCreateTaskOpen}
          onClose={() => {
            setIsCreateTaskOpen(false)
            setEditingTask(undefined)
            setCreateContext(undefined)
          }}
          context={editingTask ? undefined : createContext}
          onTaskCreated={handleTaskCreated}
          editingTask={editingTask}
          onTaskUpdated={handleTaskUpdated}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
      <header className="flex flex-col border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/70">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
            <p className="text-base font-medium text-foreground">Tasks</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openCreateTask()}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 pb-3 pt-3">
          <div className="flex items-center gap-2">
            <FilterPopover
              initialChips={filters}
              onApply={setFilters}
              onClear={() => setFilters([])}
              counts={counts}
              statusOptions={TASK_STATUS_OPTIONS}
              memberOptions={taskMemberOptions}
              priorityOptions={taskPriorityOptions}
              tagOptions={taskTagOptions}
            />
            <ChipOverflow
              chips={filters}
              onRemove={(key, value) =>
                setFilters((prev) => prev.filter((chip) => !(chip.key === key && chip.value === value)))
              }
              maxVisible={6}
            />
          </div>
          <div className="flex items-center gap-2">
            <ViewOptionsPopover options={viewOptions} onChange={setViewOptions} allowedViewTypes={["list", "board", "kanban"]} />
            <div className="relative">
              <div className="relative">
                <Button className="h-8 gap-2 shadow-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 relative z-10 px-3">
                  <Sparkle className="h-4 w-4" weight="fill" />
                  Ask AI
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {viewOptions.viewType === "kanban" ? (
        <div className="flex-1 min-h-0 px-4 py-4">
          <TaskKanbanView
            tasks={allVisibleTasks}
            onAddTask={(context) => openCreateTask(context)}
            onToggleTask={toggleTask}
            onChangeTag={changeTaskTag}
            onChangeStatus={changeTaskStatus}
            onOpenTask={(task) => setDetailTask(task)}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 space-y-4 overflow-y-auto px-4 py-4">
          {viewOptions.viewType === "list" ? (
            <DndContext id="my-tasks-list" collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <ProjectTaskListView
                groups={visibleGroups}
                onToggleTask={toggleTask}
                onAddTask={(context) => openCreateTask(context)}
                onTaskClick={(task) => setDetailTask(task)}
              />
            </DndContext>
          ) : null}
          {viewOptions.viewType === "board" ? (
            <TaskWeekBoardView
              tasks={allVisibleTasks}
              onAddTask={(context) => openCreateTask(context)}
              onToggleTask={toggleTask}
              onChangeTag={changeTaskTag}
              onMoveTaskDate={moveTaskDate}
              onOpenTask={(task) => setDetailTask(task)}
            />
          ) : null}
        </div>
      )}

      <TaskQuickCreateModal
        open={isCreateTaskOpen}
        onClose={() => {
          setIsCreateTaskOpen(false)
          setEditingTask(undefined)
          setCreateContext(undefined)
        }}
        context={editingTask ? undefined : createContext}
        onTaskCreated={handleTaskCreated}
        editingTask={editingTask}
        onTaskUpdated={handleTaskUpdated}
      />

      {detailTask !== null ? (
        <TaskDetailsPanel
          task={detailTask}
          open={true}
          onClose={() => setDetailTask(null)}
          onTaskUpdated={(updated) => {
            handleTaskUpdated(updated)
            setDetailTask(updated)
          }}
        />
      ) : null}
    </div>
  )
}
