"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Comment, User } from "@/lib/data/project-details"
import { formatDistanceToNow } from "date-fns"

type TaskCommentsProps = {
  comments: Comment[]
  onAddComment: (text: string) => void
}

export function TaskComments({ comments, onAddComment }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState('')

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim())
      setNewComment('')
    }
  }

  return (
    <div className="space-y-4">
      {/* Existing comments */}
      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={comment.author.avatarUrl} />
                <AvatarFallback className="text-xs">
                  {comment.author.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{comment.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New comment input */}
      <div className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!newComment.trim()}>
            Add comment
          </Button>
        </div>
      </div>
    </div>
  )
}
