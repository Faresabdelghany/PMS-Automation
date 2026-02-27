"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { DetailsPanelLayout, DetailsPanelHeader, DetailsPanelFooter, DetailsPanelSection } from "@/components/shared/details-panel"
import type { ProjectTask, Comment } from "@/lib/data/project-details"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { TaskDescription } from "./task-details/TaskDescription"
import { TaskComments } from "./task-details/TaskComments"
import { TaskFiles } from "./task-details/TaskFiles"
import { TaskRelated } from "./task-details/TaskRelated"

type TaskDetailsPanelProps = {
  taskId: string | null
  onClose: () => void
  onSave: (updatedTask: ProjectTask) => void | Promise<void>
}

export function TaskDetailsPanel({ taskId, onClose, onSave }: TaskDetailsPanelProps) {
  const [editedTask, setEditedTask] = useState<ProjectTask | null>(null)
  const [originalTask, setOriginalTask] = useState<ProjectTask | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load task data when taskId changes
  useEffect(() => {
    if (!taskId) {
      setEditedTask(null)
      setOriginalTask(null)
      setIsDirty(false)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    // Simulate loading delay
    const timeout = setTimeout(() => {
      // TODO: Load task from data source
      // For now, create a mock task
      const mockTask: ProjectTask = {
        id: taskId,
        name: "Mock Task",
        status: "todo",
        projectId: "proj-1",
        projectName: "Mock Project",
        workstreamId: "ws-1",
        workstreamName: "Mock Workstream",
      }

      setEditedTask(mockTask)
      setOriginalTask(mockTask)
      setIsDirty(false)
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timeout)
  }, [taskId])

  // Track dirty state
  useEffect(() => {
    if (!editedTask || !originalTask) {
      setIsDirty(false)
      return
    }

    const hasChanges = JSON.stringify(editedTask) !== JSON.stringify(originalTask)
    setIsDirty(hasChanges)
  }, [editedTask, originalTask])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to save
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (isDirty && !isSaving) {
          handleSave()
        }
      }
      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }

    if (taskId) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [taskId, isDirty, isSaving])

  const handleClose = () => {
    if (isDirty) {
      setShowUnsavedWarning(true)
    } else {
      onClose()
    }
  }

  const handleDiscardChanges = () => {
    setShowUnsavedWarning(false)
    onClose()
  }

  const handleSave = async () => {
    if (!editedTask) return

    setIsSaving(true)
    try {
      await onSave(editedTask)
      onClose()
    } catch (error) {
      console.error('Failed to save task:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const updateTask = (updates: Partial<ProjectTask>) => {
    if (!editedTask) return
    setEditedTask({ ...editedTask, ...updates })
  }

  const handleAddComment = (text: string) => {
    if (!editedTask) return

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: editedTask.assignee ?? { id: 'user-1', name: 'Current User' },
      text,
      timestamp: new Date(),
    }

    updateTask({
      comments: [...(editedTask.comments || []), newComment],
    })
  }

  const handleRemoveFile = (fileId: string) => {
    if (!editedTask) return
    updateTask({
      files: editedTask.files?.filter(f => f.id !== fileId),
    })
  }

  const handleUnlinkTask = (taskId: string) => {
    if (!editedTask) return
    updateTask({
      relatedTaskIds: editedTask.relatedTaskIds?.filter(id => id !== taskId),
    })
  }

  if (!editedTask) {
    return null
  }

  if (isLoading) {
    return (
      <Dialog open={taskId !== null} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-5xl h-[90vh] p-0">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="flex-1 p-6 space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-32 w-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const statusBadge = (
    <Badge variant={editedTask.status === 'done' ? 'default' : 'secondary'} className="text-xs">
      {editedTask.status === 'todo' ? 'To Do' : editedTask.status === 'in-progress' ? 'In Progress' : 'Done'}
    </Badge>
  )

  return (
    <>
      <Dialog open={taskId !== null} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-5xl h-[90vh] p-0">
          <DetailsPanelLayout
            leftContent={
              <div>
                <DetailsPanelHeader
                  title={editedTask.name}
                  subtitle={`${editedTask.projectName} • ${editedTask.workstreamName}`}
                  status={statusBadge}
                  onClose={handleClose}
                  editable
                  onTitleChange={(newTitle) => updateTask({ name: newTitle })}
                />
                <DetailsPanelSection title="Description">
                  <TaskDescription
                    description={editedTask.description}
                    onUpdate={(description) => updateTask({ description })}
                  />
                </DetailsPanelSection>
                <DetailsPanelSection title="Comments" collapsible defaultOpen={false}>
                  <TaskComments
                    comments={editedTask.comments || []}
                    onAddComment={handleAddComment}
                  />
                </DetailsPanelSection>
                <DetailsPanelSection title="Files" collapsible defaultOpen={false}>
                  <TaskFiles
                    files={editedTask.files || []}
                    onRemove={handleRemoveFile}
                  />
                </DetailsPanelSection>
                <DetailsPanelSection title="Related Tasks" collapsible defaultOpen={false}>
                  <TaskRelated
                    relatedTaskIds={editedTask.relatedTaskIds || []}
                    onUnlink={handleUnlinkTask}
                  />
                </DetailsPanelSection>
              </div>
            }
            rightContent={
              <div className="p-6">
                <p className="text-sm text-muted-foreground">Activity timeline will go here</p>
              </div>
            }
            footer={
              <DetailsPanelFooter
                onCancel={handleClose}
                onSave={handleSave}
                saveDisabled={!isDirty}
                isSaving={isSaving}
              />
            }
          />
        </DialogContent>
      </Dialog>

      {/* Unsaved changes warning dialog */}
      {showUnsavedWarning && (
        <Dialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
          <DialogContent className="max-w-md">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Unsaved changes</h3>
              <p className="text-sm text-muted-foreground">
                You have unsaved changes. Are you sure you want to discard them?
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowUnsavedWarning(false)}>
                  Keep editing
                </Button>
                <Button variant="destructive" onClick={handleDiscardChanges}>
                  Discard changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
