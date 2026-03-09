"use client"

import { useState } from "react"
import { FilePdf, FileDoc, File, Image, DownloadSimple, X } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import type { TaskFile } from "@/lib/data/project-details"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type TaskFilesProps = {
  files: TaskFile[]
  onRemove: (fileId: string) => void
}

export function TaskFiles({ files, onRemove }: TaskFilesProps) {
  const getFileIcon = (type: TaskFile['type']) => {
    const className = "h-5 w-5"
    switch (type) {
      case 'pdf':
        return <FilePdf className={cn(className, "text-red-500")} weight="fill" />
      case 'doc':
        return <FileDoc className={cn(className, "text-blue-500")} weight="fill" />
      case 'image':
        return <Image className={cn(className, "text-green-500")} weight="fill" />
      default:
        return <File className={cn(className, "text-muted-foreground")} weight="fill" />
    }
  }

  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">No files attached yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3 hover:bg-muted"
        >
          {getFileIcon(file.type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {file.sizeMB} MB • {format(file.uploadedDate, 'MMM dd, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <DownloadSimple className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onRemove(file.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
