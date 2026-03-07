"use client"

import { useMemo, useState } from "react"
import { Circle, CircleNotch, CheckCircle, Plus } from "@phosphor-icons/react/dist/ssr"
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Button } from "@/components/ui/button"
import type { ProjectTask, WorkstreamTaskStatus } from "@/lib/data/project-details"
import { TaskBoardCard } from "@/components/tasks/TaskBoardCard"
import type { CreateTaskContext } from "@/components/tasks/TaskQuickCreateModal"
import { cn } from "@/lib/utils"

type StatusColumnDef = {
  id: WorkstreamTaskStatus
  label: string
  icon: typeof Circle
  iconWeight: "regular" | "fill" | "bold"
  iconClass: string
}

const STATUS_COLUMNS: StatusColumnDef[] = [
  {
    id: "todo",
    label: "To do",
    icon: Circle,
    iconWeight: "regular",
    iconClass: "text-muted-foreground",
  },
  {
    id: "in-progress",
    label: "In Progress",
    icon: CircleNotch,
    iconWeight: "bold",
    iconClass: "text-amber-500",
  },
  {
    id: "done",
    label: "Done",
    icon: CheckCircle,
    iconWeight: "fill",
    iconClass: "text-emerald-500",
  },
]

type TaskKanbanViewProps = {
  tasks: ProjectTask[]
  onAddTask?: (context?: CreateTaskContext) => void
  onToggleTask?: (taskId: string) => void
  onChangeTag?: (taskId: string, tagLabel?: string) => void
  onChangeStatus?: (taskId: string, newStatus: WorkstreamTaskStatus) => void
  onOpenTask?: (task: ProjectTask) => void
}

export function TaskKanbanView({
  tasks,
  onAddTask,
  onToggleTask,
  onChangeTag,
  onChangeStatus,
  onOpenTask,
}: TaskKanbanViewProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const [activeTask, setActiveTask] = useState<ProjectTask | undefined>(undefined)

  const columns = useMemo(() => {
    return STATUS_COLUMNS.map((col) => {
      const colTasks = tasks.filter((t) => t.status === col.id)
      return { ...col, tasks: colTasks, count: colTasks.length }
    })
  }, [tasks])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(undefined)
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // Determine which status column the task was dropped on
    const activeStatus = active.data.current?.status as WorkstreamTaskStatus | undefined
    let overStatus = over.data.current?.status as WorkstreamTaskStatus | undefined

    // If dropped directly on a column droppable (the column id IS a status)
    if (!overStatus && STATUS_COLUMNS.some((c) => c.id === overId)) {
      overStatus = overId as WorkstreamTaskStatus
    }

    if (!activeStatus || !overStatus) return

    // If moved to a different status column, update the task status
    if (activeStatus !== overStatus) {
      onChangeStatus?.(activeId, overStatus)
    }
  }

  return (
    <DndContext
      id="task-kanban"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => {
        const id = String(active.id)
        const task = tasks.find((t) => t.id === id)
        setActiveTask(task)
      }}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 px-0 pb-4 h-full min-h-0">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            onAddTask={onAddTask}
            onToggleTask={onToggleTask}
            onOpenTask={onOpenTask}
            onChangeTag={onChangeTag}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskBoardCard
            task={activeTask}
            variant={activeTask.status === "done" ? "completed" : "default"}
            onToggle={() => onToggleTask?.(activeTask.id)}
            onOpen={() => onOpenTask?.(activeTask)}
            onChangeTag={(tagLabel) => onChangeTag?.(activeTask.id, tagLabel)}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

type KanbanColumnProps = {
  column: StatusColumnDef & { tasks: ProjectTask[]; count: number }
  onAddTask?: (context?: CreateTaskContext) => void
  onToggleTask?: (taskId: string) => void
  onOpenTask?: (task: ProjectTask) => void
  onChangeTag?: (taskId: string, tagLabel?: string) => void
}

function KanbanColumn({ column, onAddTask, onToggleTask, onOpenTask, onChangeTag }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
    data: { status: column.id },
  })

  const Icon = column.icon

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-w-[280px] rounded-2xl border border-border bg-muted/50 p-3 flex flex-col min-h-0 transition-colors",
        isOver && "border-primary/60 bg-primary/5",
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4.5 w-4.5", column.iconClass)} weight={column.iconWeight} />
          <span className="text-sm font-semibold">{column.label}</span>
          <span className="text-sm text-muted-foreground">{column.count}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={() => onAddTask?.()}
          aria-label={`Add task to ${column.label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Column body */}
      <SortableContext
        items={column.tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-3 min-h-0 overflow-y-auto">
          {column.tasks.length === 0 ? (
            <div className="border border-dashed border-border/60 min-h-40 items-center justify-center p-4 rounded-2xl flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">No tasks</p>
            </div>
          ) : (
            column.tasks.map((task) => (
              <SortableKanbanCard
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                onOpen={onOpenTask}
                onChangeTag={onChangeTag}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

type SortableKanbanCardProps = {
  task: ProjectTask
  onToggle?: (taskId: string) => void
  onOpen?: (task: ProjectTask) => void
  onChangeTag?: (taskId: string, tagLabel?: string) => void
}

function SortableKanbanCard({ task, onToggle, onOpen, onChangeTag }: SortableKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-50")}
      {...attributes}
      {...listeners}
    >
      <TaskBoardCard
        task={task}
        variant={task.status === "done" ? "completed" : "default"}
        onToggle={() => onToggle?.(task.id)}
        onOpen={() => onOpen?.(task)}
        onChangeTag={(tagLabel) => onChangeTag?.(task.id, tagLabel)}
      />
    </div>
  )
}
