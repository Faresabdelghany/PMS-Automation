"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { cn } from "@/lib/utils"

type TaskDescriptionProps = {
  description?: string
  onUpdate: (description: string) => void
}

export function TaskDescription({ description = '', onUpdate }: TaskDescriptionProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Add a description...',
      }),
    ],
    content: description,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none',
          'min-h-[120px] px-3 py-2 rounded-md border border-border',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
        ),
      },
    },
  })

  return (
    <div className="space-y-2">
      <EditorContent editor={editor} />
    </div>
  )
}
