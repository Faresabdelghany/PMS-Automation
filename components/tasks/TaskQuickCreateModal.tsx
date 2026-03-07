'use client'

import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CalendarBlank, ChartBar, Paperclip, Tag as TagIcon, Microphone, UserCircle, X, Folder } from '@phosphor-icons/react/dist/ssr'

import type { ProjectTask, User } from '@/lib/data/project-details'
import { getAvatarUrl } from '@/lib/assets/avatars'
import { createTask as createTaskService, updateTask as updateTaskService, type CreateTaskInput, type UpdateTaskInput } from '@/lib/services/tasks'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { GenericPicker, DatePicker } from '@/components/project-wizard/steps/StepQuickCreate'
import { ProjectDescriptionEditor } from '@/components/project-wizard/ProjectDescriptionEditor'
import { QuickCreateModalLayout } from '@/components/QuickCreateModalLayout'
import { toast } from 'sonner'

export type CreateTaskContext = {
  projectId?: string
  workstreamId?: string
  workstreamName?: string
}

interface TaskQuickCreateModalProps {
  open: boolean
  onClose: () => void
  context?: CreateTaskContext
  onTaskCreated?: (task: ProjectTask) => void
  editingTask?: ProjectTask
  onTaskUpdated?: (task: ProjectTask) => void
}

type TaskStatusId = 'todo' | 'in-progress' | 'done'

type StatusOption = {
  id: TaskStatusId
  label: string
}

type AssigneeOption = {
  id: string
  name: string
}

type PriorityOption = {
  id: "no-priority" | "low" | "medium" | "high" | "urgent"
  label: string
}

export type TagOption = {
  id: string
  label: string
}

type CategoryOption = {
  id: string
  label: string
}

const STATUS_OPTIONS: StatusOption[] = [
  { id: 'todo', label: 'To do' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
]

const ASSIGNEE_OPTIONS: AssigneeOption[] = [
  { id: 'ziko', name: 'Ziko' },
  { id: 'product-analyst', name: 'Product Analyst' },
  { id: 'dev', name: 'Dev' },
  { id: 'testing-agent', name: 'Testing Agent' },
  { id: 'code-reviewer', name: 'Code Reviewer' },
  { id: 'designer', name: 'Designer' },
  { id: 'marketing-agent', name: 'Marketing Agent' },
  { id: 'job-search-agent', name: 'Job Search Agent' },
]

const PRIORITY_OPTIONS: PriorityOption[] = [
  { id: 'no-priority', label: 'No priority' },
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' },
]

export const TAG_OPTIONS: TagOption[] = [
  { id: 'feature', label: 'Feature' },
  { id: 'bug', label: 'Bug' },
  { id: 'internal', label: 'Internal' },
]

const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 'work', label: 'Work' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'development', label: 'Development' },
  { id: 'personal', label: 'Personal' },
]

function toUser(option: AssigneeOption | undefined): User | undefined {
  if (!option) return undefined
  return {
    id: option.id,
    name: option.name,
    avatarUrl: getAvatarUrl(option.name),
  }
}

export function TaskQuickCreateModal({ open, onClose, context, onTaskCreated, editingTask, onTaskUpdated }: TaskQuickCreateModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState<string | undefined>(undefined)
  const [createMore, setCreateMore] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [category, setCategory] = useState<CategoryOption | undefined>(CATEGORY_OPTIONS[0])
  const [assignee, setAssignee] = useState<AssigneeOption | undefined>(ASSIGNEE_OPTIONS[0])
  const [status, setStatus] = useState<StatusOption>(STATUS_OPTIONS[0])
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined)
  const [priority, setPriority] = useState<PriorityOption | undefined>(PRIORITY_OPTIONS[0])
  const [selectedTag, setSelectedTag] = useState<TagOption | undefined>(undefined)

  useEffect(() => {
    if (!open) return

    if (editingTask) {
      setTitle(editingTask.name)
      setDescription(editingTask.description)
      setCreateMore(false)
      setIsDescriptionExpanded(false)

      const catOption = editingTask.category
        ? CATEGORY_OPTIONS.find((c) => c.label === editingTask.category)
        : undefined
      setCategory(catOption ?? CATEGORY_OPTIONS[0])

      if (editingTask.assignee) {
        const assigneeOption = ASSIGNEE_OPTIONS.find((a) => a.name === editingTask.assignee?.name)
        setAssignee(assigneeOption ?? ASSIGNEE_OPTIONS[0])
      } else {
        setAssignee(ASSIGNEE_OPTIONS[0])
      }

      const statusOption = STATUS_OPTIONS.find((s) => s.id === editingTask.status)
      setStatus(statusOption ?? STATUS_OPTIONS[0])

      setStartDate(editingTask.startDate ?? new Date())
      setTargetDate(editingTask.dueLabel ? undefined : undefined)

      const priorityOption = editingTask.priority
        ? PRIORITY_OPTIONS.find((p) => p.id === editingTask.priority)
        : undefined
      setPriority(priorityOption ?? PRIORITY_OPTIONS[0])

      const tagOption = editingTask.tag
        ? TAG_OPTIONS.find((t) => t.label === editingTask.tag)
        : undefined
      setSelectedTag(tagOption)

      return
    }

    // Default category from context (if adding from a category group)
    const contextCategory = context?.workstreamName
      ? CATEGORY_OPTIONS.find((c) => c.label === context.workstreamName)
      : undefined

    setCategory(contextCategory ?? CATEGORY_OPTIONS[0])
    setTitle('')
    setDescription(undefined)
    setCreateMore(false)
    setIsDescriptionExpanded(false)
    setAssignee(ASSIGNEE_OPTIONS[0])
    setStatus(STATUS_OPTIONS[0])
    setStartDate(new Date())
    setTargetDate(undefined)
    setPriority(PRIORITY_OPTIONS[0])
    setSelectedTag(undefined)
  }, [open, context?.workstreamName, editingTask])

  const handleSubmit = async () => {
    if (isSaving) return
    setIsSaving(true)

    try {
      if (editingTask) {
        const input: UpdateTaskInput = {
          name: title.trim() || 'Untitled task',
          status: status.id,
          priority: priority?.id,
          category: category?.label,
          tag: selectedTag?.label,
          description,
          dueLabel: targetDate ? format(targetDate, 'yyyy-MM-dd') : editingTask.dueLabel,
          startDate,
          assignee: assignee?.name ?? null,
        }

        const updated = await updateTaskService(editingTask.id, input)
        if (updated) {
          onTaskUpdated?.(updated)
          toast.success("Task updated successfully")
        } else {
          toast.error("Failed to update task")
        }
        onClose()
        return
      }

      const input: CreateTaskInput = {
        name: title.trim() || 'Untitled task',
        status: status.id,
        priority: priority?.id,
        category: category?.label,
        tag: selectedTag?.label,
        description,
        dueLabel: targetDate ? format(targetDate, 'yyyy-MM-dd') : undefined,
        startDate,
        assignee: assignee?.name,
      }

      const created = await createTaskService(input)
      if (created) {
        onTaskCreated?.(created)

        if (createMore) {
          toast.success("Task created! Ready for another.")
          setTitle('')
          setDescription(undefined)
          setStatus(STATUS_OPTIONS[0])
          setTargetDate(undefined)
          return
        }

        toast.success("Task created successfully")
      } else {
        toast.error("Failed to create task")
      }
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <QuickCreateModalLayout
      open={open}
      onClose={onClose}
      isDescriptionExpanded={isDescriptionExpanded}
      onSubmitShortcut={handleSubmit}
    >
      {/* Context row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <GenericPicker
            items={CATEGORY_OPTIONS}
            selectedId={category?.id}
            onSelect={setCategory}
            placeholder="Choose category..."
            renderItem={(item) => (
              <div className="flex items-center justify-between w-full gap-2">
                <span>{item.label}</span>
              </div>
            )}
            trigger={
              <button
                className="bg-background flex gap-2 h-7 items-center px-2 py-1 rounded-lg border border-background hover:border-primary/50 transition-colors text-xs disabled:opacity-60"
              >
                <Folder className="size-4 text-muted-foreground" />
                <span className="truncate max-w-[160px] font-medium text-foreground">
                  {category?.label ?? 'Category'}
                </span>
              </button>
            }
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 rounded-full opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-2 w-full shrink-0 mt-1">
        <div className="flex gap-1 h-10 items-center w-full">
          <input
            id="task-create-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full font-normal leading-7 text-foreground placeholder:text-muted-foreground text-xl outline-none bg-transparent border-none p-0"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Description */}
      <ProjectDescriptionEditor
        value={description}
        onChange={setDescription}
        onExpandChange={setIsDescriptionExpanded}
        placeholder="Briefly describe the goal or details of this task..."
        showTemplates={false}
      />

      {/* Properties */}
      <div className="flex flex-wrap gap-2.5 items-start w-full shrink-0">
        {/* Assignee */}
        <GenericPicker
          items={ASSIGNEE_OPTIONS}
          onSelect={setAssignee}
          selectedId={assignee?.id}
          placeholder="Assign owner..."
          renderItem={(item) => (
            <div className="flex items-center gap-2 w-full">
              <div className="size-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                {item.name.charAt(0)}
              </div>
              <span className="flex-1">{item.name}</span>
            </div>
          )}
          trigger={
            <button className="bg-muted flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:border-primary/50 transition-colors">
              <div className="size-4 rounded-full bg-background flex items-center justify-center text-[10px] font-medium">
                {assignee?.name.charAt(0) ?? '?'}
              </div>
              <span className="font-medium text-foreground text-sm leading-5">
                {assignee?.name ?? 'Assignee'}
              </span>
            </button>
          }
        />

        {/* Start date */}
        <DatePicker
          date={startDate}
          onSelect={setStartDate}
          trigger={
            <button className="bg-muted flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:border-primary/50 transition-colors">
              <CalendarBlank className="size-4 text-muted-foreground" />
              <span className="font-medium text-foreground text-sm leading-5">
                {startDate ? `Start: ${format(startDate, 'dd/MM/yyyy')}` : 'Start date'}
              </span>
            </button>
          }
        />

        {/* Status */}
        <GenericPicker
          items={STATUS_OPTIONS}
          onSelect={setStatus}
          selectedId={status.id}
          placeholder="Change status..."
          renderItem={(item) => (
            <div className="flex items-center gap-2 w-full">
              <span className="flex-1">{item.label}</span>
            </div>
          )}
          trigger={
            <button className="bg-background flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:bg-black/5 transition-colors">
              <UserCircle className="size-4 text-muted-foreground" />
              <span className="font-medium text-foreground text-sm leading-5">
                {status.label}
              </span>
            </button>
          }
        />

        {/* Target date */}
        <DatePicker
          date={targetDate}
          onSelect={setTargetDate}
          trigger={
            <button className="bg-background flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:bg-black/5 transition-colors">
              <CalendarBlank className="size-4 text-muted-foreground" />
              <span className="font-medium text-foreground text-sm leading-5">
                {targetDate ? format(targetDate, 'dd/MM/yyyy') : 'Target'}
              </span>
            </button>
          }
        />

        {/* Priority */}
        <GenericPicker
          items={PRIORITY_OPTIONS}
          onSelect={setPriority}
          selectedId={priority?.id}
          placeholder="Set priority..."
          renderItem={(item) => (
            <div className="flex items-center gap-2 w-full">
              <span className="flex-1">{item.label}</span>
            </div>
          )}
          trigger={
            <button className="bg-background flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:bg-black/5 transition-colors">
              <ChartBar className="size-4 text-muted-foreground" />
              <span className="font-medium text-foreground text-sm leading-5">
                {priority?.label ?? 'Priority'}
              </span>
            </button>
          }
        />

        {/* Tag */}
        <GenericPicker
          items={TAG_OPTIONS}
          onSelect={setSelectedTag}
          selectedId={selectedTag?.id}
          placeholder="Add tag..."
          renderItem={(item) => (
            <div className="flex items-center gap-2 w-full">
              <span className="flex-1">{item.label}</span>
            </div>
          )}
          trigger={
            <button className="bg-background flex gap-2 h-9 items-center px-3 py-2 rounded-lg border border-border hover:bg-black/5 transition-colors">
              <TagIcon className="size-4 text-muted-foreground" />
              <span className="font-medium text-foreground text-sm leading-5">
                {selectedTag?.label ?? 'Tag'}
              </span>
            </button>
          }
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto w-full pt-4 shrink-0">
        <div className="flex items-center gap-1">
          <button className="flex items-center justify-center size-10 rounded-lg hover:bg-muted transition-colors">
            <Paperclip className="size-4 text-muted-foreground" />
          </button>
          <button className="flex items-center justify-center size-10 rounded-lg hover:bg-muted transition-colors">
            <Microphone className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {!editingTask && (
            <div className="flex items-center gap-2">
              <Switch
                checked={createMore}
                onCheckedChange={(value) => setCreateMore(Boolean(value))}
              />
              <span className="text-sm font-medium text-foreground">Create more</span>
            </div>
          )}

          <Button type="button" onClick={handleSubmit} disabled={isSaving} className="h-10 px-4 rounded-xl">
            {isSaving ? 'Saving...' : editingTask ? 'Save changes' : 'Create Task'}
          </Button>
        </div>
      </div>
    </QuickCreateModalLayout>
  )
}
