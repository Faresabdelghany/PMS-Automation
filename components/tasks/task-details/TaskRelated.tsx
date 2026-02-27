"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "@phosphor-icons/react/dist/ssr"

type TaskRelatedProps = {
  relatedTaskIds: string[]
  onUnlink: (taskId: string) => void
}

export function TaskRelated({ relatedTaskIds, onUnlink }: TaskRelatedProps) {
  // Mock task names - in real app, fetch from data source
  const getTaskName = (taskId: string) => `Task ${taskId.slice(-4)}`

  if (relatedTaskIds.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">No related tasks yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {relatedTaskIds.map((taskId) => (
        <div
          key={taskId}
          className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3 hover:bg-muted"
        >
          <div className="flex-1">
            <p className="text-sm font-medium">{getTaskName(taskId)}</p>
            <p className="text-xs text-muted-foreground">Related task</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUnlink(taskId)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
