"use client"

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import LinkExtension from "@tiptap/extension-link"
import Mention from "@tiptap/extension-mention"
import Placeholder from "@tiptap/extension-placeholder"
import {
  TextB, TextItalic, TextUnderline, TextStrikethrough,
  LinkSimple, ListNumbers, ListBullets, Code, Quotes,
  Paperclip, PaperPlaneTilt, Smiley, At, Plus, TextAa,
  DotsThree,
  File as FileIcon, FilePdf, FileImage, FileDoc, FileXls, FilePpt,
  FileZip, X,
} from "@phosphor-icons/react/dist/ssr"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAvatarUrl } from "@/lib/assets/avatars"
import { cn } from "@/lib/utils"

/* ─── Constants ─── */

const CURRENT_USER = "Jason Duong"

const ALL_COMMENT_MEMBERS = [
  { name: "Dea Ananda" },
  { name: "Akmal Nasrulloh" },
  { name: "Aldyyy" },
  { name: "Rahmadini" },
  { name: "Jason Duong" },
]

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/* ─── Types ─── */

type Attachment = {
  id: string
  name: string
  size: number
  type: string
  previewUrl?: string // data URL for image previews
}

type Comment = {
  id: string
  user: { name: string }
  timestamp: Date
  html: string
  attachments?: Attachment[]
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return FileImage
  if (type === "application/pdf") return FilePdf
  if (type.includes("word") || type.includes("document")) return FileDoc
  if (type.includes("sheet") || type.includes("excel")) return FileXls
  if (type.includes("presentation") || type.includes("powerpoint")) return FilePpt
  if (type.includes("zip") || type.includes("compressed") || type.includes("archive")) return FileZip
  return FileIcon
}

/* ─── Seed data ─── */

const seedComments: Comment[] = [
  {
    id: "c1",
    user: { name: "Dea Ananda" },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    html: `<p>Hey team, I've been reviewing the design brief and I think we need to adjust the KPI dashboard layout. <span data-type="mention" data-id="Rahmadini" data-label="Rahmadini">@Rahmadini</span> can you take a look at the wireframes? 🤔</p>`,
  },
  {
    id: "c2",
    user: { name: "Akmal Nasrulloh" },
    timestamp: new Date(Date.now() - 90 * 60 * 1000),
    html: `<p>I agree with the changes. The current layout doesn't align well with the client's requirements. <span data-type="mention" data-id="Dea Ananda" data-label="Dea Ananda">@Dea Ananda</span> we should schedule a review meeting.</p>`,
  },
  {
    id: "c3",
    user: { name: "Aldyyy" },
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    html: `<p>Yup that's right. It should be user-friendly and intuitive ✨</p>`,
    attachments: [
      { id: "a1", name: "KPI-Dashboard-Wireframe-v2.pdf", size: 2_450_000, type: "application/pdf" },
      { id: "a2", name: "design-mockup.png", size: 845_000, type: "image/png" },
    ],
  },
]

const NEW_MESSAGES_DIVIDER_AFTER = 1

/* ─── Emoji data ─── */

const EMOJI_DATA = [
  { category: "Smileys", emojis: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🥰", "😍", "🤩", "😘", "😋", "🤔", "😐", "🙄", "😤", "😢", "😭"] },
  { category: "Gestures", emojis: ["👍", "👎", "👋", "✋", "🤝", "👏", "🙌", "✌️", "🤞", "💪", "🙏", "✍️"] },
  { category: "Hearts", emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💔", "💕", "💖"] },
  { category: "Objects", emojis: ["⭐", "🌟", "✨", "💫", "🔥", "💯", "🎉", "🎊", "🏆", "💡", "📌", "🔔"] },
]

/* ─── CommentsTab ─── */

type CommentsTabProps = {
  onCountChange?: (count: number) => void
}

export function CommentsTab({ onCountChange }: CommentsTabProps) {
  const [comments, setComments] = useState<Comment[]>(seedComments)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showToolbar, setShowToolbar] = useState(true)
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([])
  const [editorEmpty, setEditorEmpty] = useState(true)
  const emojiBtnRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sendCommentRef = useRef<() => void>(() => {})
  const mentionVisibleRef = useRef(false)
  const editorRef = useRef<any>(null)

  // Notify parent of count changes
  useEffect(() => { onCountChange?.(comments.length) }, [comments.length, onCountChange])

  /* ── Mention suggestion state ── */
  const [mentionVisible, setMentionVisible] = useState(false)
  const [mentionItems, setMentionItems] = useState<string[]>([])
  const [mentionSelected, setMentionSelected] = useState(0)
  const [mentionRect, setMentionRect] = useState<DOMRect | null>(null)
  const mentionCommandRef = useRef<((attrs: { id: string; label?: string }) => void) | null>(null)
  const mentionItemsRef = useRef<string[]>([])
  const mentionSelectedRef = useRef(0)

  useEffect(() => { mentionItemsRef.current = mentionItems }, [mentionItems])
  useEffect(() => { mentionSelectedRef.current = mentionSelected }, [mentionSelected])
  useEffect(() => { mentionVisibleRef.current = mentionVisible }, [mentionVisible])

  // Stable refs for suggestion callbacks (avoids recreating editor)
  const onStartRef = useRef<(props: any) => void>(() => {})
  const onUpdateRef = useRef<(props: any) => void>(() => {})
  const onKeyDownRef = useRef<(props: any) => boolean>(() => false)
  const onExitRef = useRef<() => void>(() => {})

  onStartRef.current = (props: any) => {
    mentionCommandRef.current = props.command
    mentionItemsRef.current = props.items
    mentionSelectedRef.current = 0
    setMentionVisible(true)
    setMentionItems(props.items)
    setMentionSelected(0)
    setMentionRect(props.clientRect?.() ?? null)
  }

  onUpdateRef.current = (props: any) => {
    mentionCommandRef.current = props.command
    mentionItemsRef.current = props.items
    setMentionItems(props.items)
    setMentionRect(props.clientRect?.() ?? null)
    if (mentionSelectedRef.current >= props.items.length) {
      mentionSelectedRef.current = 0
      setMentionSelected(0)
    }
  }

  onKeyDownRef.current = ({ event }: { event: KeyboardEvent }) => {
    const items = mentionItemsRef.current
    if (!items.length) return false
    if (event.key === "ArrowUp") {
      const next = (mentionSelectedRef.current - 1 + items.length) % items.length
      mentionSelectedRef.current = next
      setMentionSelected(next)
      return true
    }
    if (event.key === "ArrowDown") {
      const next = (mentionSelectedRef.current + 1) % items.length
      mentionSelectedRef.current = next
      setMentionSelected(next)
      return true
    }
    if (event.key === "Enter") {
      const name = items[mentionSelectedRef.current]
      if (name) mentionCommandRef.current?.({ id: name, label: name })
      return true
    }
    if (event.key === "Escape") {
      setMentionVisible(false)
      return true
    }
    return false
  }

  onExitRef.current = () => {
    setMentionVisible(false)
    mentionCommandRef.current = null
  }

  const mentionSuggestion = useMemo(
    () => ({
      items: ({ query }: { query: string }) =>
        ALL_COMMENT_MEMBERS
          .map((m) => m.name)
          .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5),
      render: () => ({
        onStart: (props: any) => onStartRef.current(props),
        onUpdate: (props: any) => onUpdateRef.current(props),
        onKeyDown: (props: any) => onKeyDownRef.current(props),
        onExit: () => onExitRef.current(),
      }),
    }),
    [],
  )

  /* ── Tiptap editor ── */
  const extensions = useMemo(
    () => [
      StarterKit.configure({ heading: false, link: false, underline: false }),
      Underline,
      LinkExtension.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: "Write a comment..." }),
      Mention.configure({
        HTMLAttributes: { class: "mention-node" },
        suggestion: mentionSuggestion,
      }),
    ],
    [mentionSuggestion],
  )

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: "",
    onUpdate: ({ editor: e }) => setEditorEmpty(e.isEmpty),
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[60px] px-3 py-2 text-sm leading-relaxed",
      },
      handleKeyDown: (_view, event) => {
        // Don't intercept while mention dropdown is open
        if (mentionVisibleRef.current) return false

        const mod = event.ctrlKey || event.metaKey

        // Enter = send, Shift+Enter = new line (Slack)
        if (event.key === "Enter" && !event.shiftKey && !mod) {
          event.preventDefault()
          sendCommentRef.current()
          return true
        }

        const ed = editorRef.current
        if (!ed || !mod) return false

        // Ctrl+Shift+X → Strikethrough (Slack)
        if (event.shiftKey && event.code === "KeyX") {
          event.preventDefault()
          ed.chain().focus().toggleStrike().run()
          return true
        }

        // Ctrl+Alt+Shift+C → Code block (Slack) — check BEFORE Ctrl+Shift+C
        if (event.altKey && event.shiftKey && event.code === "KeyC") {
          event.preventDefault()
          ed.chain().focus().toggleCodeBlock().run()
          return true
        }

        // Ctrl+Shift+C → Inline code (Slack)
        if (event.shiftKey && !event.altKey && event.code === "KeyC") {
          event.preventDefault()
          ed.chain().focus().toggleCode().run()
          return true
        }

        // Ctrl+Shift+U → Insert link (Slack)
        if (event.shiftKey && event.code === "KeyU") {
          event.preventDefault()
          const url = window.prompt("URL")
          if (url) ed.chain().focus().setLink({ href: url }).run()
          return true
        }

        // Ctrl+Shift+9 → Blockquote (Slack)
        if (event.shiftKey && event.code === "Digit9") {
          event.preventDefault()
          ed.chain().focus().toggleBlockquote().run()
          return true
        }

        // Ctrl+Shift+8 → Bullet list (Slack)
        if (event.shiftKey && event.code === "Digit8") {
          event.preventDefault()
          ed.chain().focus().toggleBulletList().run()
          return true
        }

        // Ctrl+Shift+7 → Ordered list (Slack)
        if (event.shiftKey && event.code === "Digit7") {
          event.preventDefault()
          ed.chain().focus().toggleOrderedList().run()
          return true
        }

        return false
      },
    },
  })

  const sendComment = useCallback(() => {
    if (!editor) return
    const hasText = !editorEmpty
    const hasFiles = pendingFiles.length > 0
    if (!hasText && !hasFiles) return
    const html = editor.getHTML()
    setComments((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        user: { name: CURRENT_USER },
        timestamp: new Date(),
        html: hasText ? html : "<p></p>",
        attachments: hasFiles ? [...pendingFiles] : undefined,
      },
    ])
    editor.commands.clearContent()
    setEditorEmpty(true)
    setPendingFiles([])
    setShowEmojiPicker(false)
  }, [editor, editorEmpty, pendingFiles])

  useEffect(() => { sendCommentRef.current = sendComment }, [sendComment])
  useEffect(() => { editorRef.current = editor }, [editor])

  const insertEmoji = useCallback(
    (emoji: string) => {
      editor?.chain().focus().insertContent(emoji).run()
    },
    [editor],
  )

  const triggerMention = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertContent("@").run()
  }, [editor])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      const attachment: Attachment = {
        id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        type: file.type,
      }
      // Generate image preview
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = () => {
          setPendingFiles((prev) =>
            prev.map((f) => (f.id === attachment.id ? { ...f, previewUrl: reader.result as string } : f)),
          )
        }
        reader.readAsDataURL(file)
      }
      setPendingFiles((prev) => [...prev, attachment])
    })
    e.target.value = ""
  }, [])

  const removePendingFile = useCallback((id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return
    const handler = (e: MouseEvent) => {
      if (emojiBtnRef.current?.contains(e.target as Node)) return
      const picker = document.getElementById("comments-emoji-picker")
      if (picker?.contains(e.target as Node)) return
      setShowEmojiPicker(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showEmojiPicker])


  return (
    <div className="pt-5 flex flex-col gap-4">
      {/* Scoped editor & mention styles */}
      <style>{`
        .comment-html [data-type="mention"] {
          border-radius: 4px;
          padding: 1px 6px;
          font-weight: 500;
          font-size: 0.8125rem;
          white-space: nowrap;
        }
        .comment-html [data-type="mention"][data-id="Rahmadini"],
        .comment-html [data-type="mention"][data-id="Aldyyy"] {
          background: #dcfce7; color: #15803d;
        }
        .comment-html [data-type="mention"][data-id="Dea Ananda"],
        .comment-html [data-type="mention"][data-id="Jason Duong"] {
          background: #dbeafe; color: #1d4ed8;
        }
        .comment-html [data-type="mention"][data-id="Akmal Nasrulloh"] {
          background: #f3e8ff; color: #7c3aed;
        }
        .comment-html p { margin: 0; }
        .comment-html ul { padding-left: 1.5em; list-style-type: disc; }
        .comment-html ol { padding-left: 1.5em; list-style-type: decimal; }
        .comment-html li { display: list-item; }
        .comment-html blockquote {
          border-left: 3px solid var(--border); padding-left: 0.75em;
          color: var(--muted-foreground);
        }
        .comment-html code {
          background: var(--muted); padding: 2px 4px;
          border-radius: 3px; font-size: 0.875em;
        }
        .comment-html s { text-decoration: line-through; }

        .tiptap-comments .ProseMirror { outline: none; }
        .tiptap-comments .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--muted-foreground);
          pointer-events: none;
          height: 0;
          opacity: 0.5;
        }
        .tiptap-comments .ProseMirror [data-type="mention"] {
          background: #dbeafe; color: #1d4ed8;
          border-radius: 4px; padding: 1px 6px;
          font-weight: 500; font-size: 0.875rem;
          box-decoration-break: clone;
        }
        .tiptap-comments .ProseMirror p { margin: 0.25em 0; }
        .tiptap-comments .ProseMirror ul { padding-left: 1.5em; margin: 0.25em 0; list-style-type: disc; }
        .tiptap-comments .ProseMirror ol { padding-left: 1.5em; margin: 0.25em 0; list-style-type: decimal; }
        .tiptap-comments .ProseMirror li { display: list-item; }
        .tiptap-comments .ProseMirror li p { margin: 0; }
        .tiptap-comments .ProseMirror blockquote {
          border-left: 3px solid var(--border); padding-left: 0.75em;
          margin: 0.25em 0; color: var(--muted-foreground);
        }
        .tiptap-comments .ProseMirror code {
          background: var(--muted); padding: 2px 4px;
          border-radius: 3px; font-size: 0.875em;
        }
        .tiptap-comments .ProseMirror pre {
          background: var(--muted); padding: 0.75em;
          border-radius: 6px; margin: 0.5em 0;
        }
        .tiptap-comments .ProseMirror pre code { background: none; padding: 0; }
        .tiptap-comments .ProseMirror a { color: oklch(0.55 0.15 250); text-decoration: underline; }
        .tiptap-comments .ProseMirror s { text-decoration: line-through; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Comments</h3>
        <button className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors">
          <DotsThree className="h-5 w-5" weight="bold" />
        </button>
      </div>

      {/* Comments list */}
      <div className="space-y-0">
        {comments.map((comment, index) => (
          <div key={comment.id}>
            {index === NEW_MESSAGES_DIVIDER_AFTER + 1 && (
              <div className="flex items-center gap-3 py-2 my-1">
                <div className="flex-1 h-px bg-orange-400/60" />
                <span className="text-[11px] font-semibold text-orange-500 uppercase tracking-wider whitespace-nowrap">
                  New Messages
                </span>
                <div className="flex-1 h-px bg-orange-400/60" />
              </div>
            )}
            <CommentItem comment={comment} />
          </div>
        ))}
      </div>

      {/* Rich text editor */}
      <div className="relative rounded-lg border border-border bg-background overflow-visible">
        {/* Formatting toolbar (Slack Aa toggle) */}
        {showToolbar && (
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/60">
            <ToolbarBtn
              active={editor?.isActive("bold")}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              title="Bold (Ctrl+B)"
            >
              <TextB className="h-4 w-4" weight="bold" />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor?.isActive("italic")}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              title="Italic (Ctrl+I)"
            >
              <TextItalic className="h-4 w-4" />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor?.isActive("underline")}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              title="Underline (Ctrl+U)"
            >
              <TextUnderline className="h-4 w-4" />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor?.isActive("strike")}
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              title="Strikethrough (Ctrl+Shift+X)"
            >
              <TextStrikethrough className="h-4 w-4" />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor?.isActive("link")}
              onClick={() => {
                const url = window.prompt("URL")
                if (url) editor?.chain().focus().setLink({ href: url }).run()
              }}
              title="Link (Ctrl+Shift+U)"
            >
              <LinkSimple className="h-4 w-4" />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor?.isActive("orderedList")}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              title="Ordered list (Ctrl+Shift+7)"
            >
              <ListNumbers className="h-4 w-4" />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor?.isActive("bulletList")}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              title="Bullet list (Ctrl+Shift+8)"
            >
              <ListBullets className="h-4 w-4" />
            </ToolbarBtn>
            <div className="w-px h-4 bg-border mx-1" />
            <ToolbarBtn
              active={editor?.isActive("code")}
              onClick={() => editor?.chain().focus().toggleCode().run()}
              title="Inline code (Ctrl+Shift+C)"
            >
              <Code className="h-4 w-4" />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor?.isActive("blockquote")}
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              title="Quote (Ctrl+Shift+9)"
            >
              <Quotes className="h-4 w-4" />
            </ToolbarBtn>
          </div>
        )}

        {/* Editor content */}
        <div className="tiptap-comments">
          <EditorContent editor={editor} />
        </div>

        {/* Pending file attachments preview */}
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 py-2 border-t border-border/60">
            {pendingFiles.map((file) => (
              <div
                key={file.id}
                className="group relative flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs max-w-[200px]"
              >
                {file.previewUrl ? (
                  <img src={file.previewUrl} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                ) : (
                  (() => {
                    const Icon = getFileIcon(file.type)
                    return <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  })()
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{file.name}</p>
                  <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={() => removePendingFile(file.id)}
                  className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground/80 text-background opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* File input — display:none keeps it out of Radix focus trap, <label htmlFor> triggers natively */}
        <input
          id="comment-file-upload"
          ref={fileInputRef}
          type="file"
          multiple
          tabIndex={-1}
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-2 py-1.5 border-t border-border/60">
          <div className="flex items-center gap-0.5">
            <label
              htmlFor="comment-file-upload"
              title="Upload file"
              className={cn(
                "flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground transition-colors cursor-pointer",
                "hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Plus className="h-4 w-4" />
            </label>
            <ToolbarBtn
              title={showToolbar ? "Hide formatting (Aa)" : "Show formatting (Aa)"}
              onClick={() => setShowToolbar((v) => !v)}
              active={showToolbar}
            >
              <TextAa className="h-4 w-4" />
            </ToolbarBtn>
            <ToolbarBtn
              ref={emojiBtnRef}
              title="Emoji"
              onClick={() => setShowEmojiPicker((v) => !v)}
              active={showEmojiPicker}
            >
              <Smiley className="h-4 w-4" />
            </ToolbarBtn>
            <ToolbarBtn title="Mention" onClick={triggerMention}>
              <At className="h-4 w-4" />
            </ToolbarBtn>
          </div>
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="comment-file-upload"
              title="Attach file"
              className={cn(
                "flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground transition-colors cursor-pointer",
                "hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Paperclip className="h-4 w-4" />
            </label>
            <button
              onClick={sendComment}
              disabled={!editor || (editorEmpty && pendingFiles.length === 0)}
              title="Send (Enter)"
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Send
              <PaperPlaneTilt className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>


        {/* Emoji picker popup */}
        {showEmojiPicker && (
          <div
            id="comments-emoji-picker"
            className="absolute bottom-full left-0 mb-2 w-[280px] max-h-[260px] overflow-y-auto rounded-lg border border-border bg-popover shadow-lg p-2 z-50"
          >
            {EMOJI_DATA.map((group) => (
              <div key={group.category} className="mb-2 last:mb-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-1">
                  {group.category}
                </p>
                <div className="grid grid-cols-8 gap-0.5">
                  {group.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        insertEmoji(emoji)
                        setShowEmojiPicker(false)
                      }}
                      className="flex items-center justify-center h-8 w-8 rounded hover:bg-accent text-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mention suggestion dropdown */}
        {mentionVisible && mentionItems.length > 0 && (
          <div
            className="fixed z-[100] rounded-lg border border-border bg-popover shadow-lg py-1 min-w-[220px]"
            style={{
              top: mentionRect ? mentionRect.bottom + 4 : 0,
              left: mentionRect ? mentionRect.left : 0,
            }}
          >
            {mentionItems.map((name, index) => (
              <button
                key={name}
                onMouseDown={(e) => {
                  e.preventDefault()
                  mentionCommandRef.current?.({ id: name, label: name })
                }}
                className={cn(
                  "flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors",
                  index === mentionSelected ? "bg-accent" : "hover:bg-accent/50",
                )}
              >
                <Avatar className="h-6 w-6">
                  {getAvatarUrl(name) && <AvatarImage src={getAvatarUrl(name)} />}
                  <AvatarFallback className="text-[8px]">{getInitials(name)}</AvatarFallback>
                </Avatar>
                <span className="text-foreground">{name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── CommentItem ─── */

function CommentItem({ comment }: { comment: Comment }) {
  const hasText = comment.html && comment.html !== "<p></p>"
  return (
    <div className="flex gap-3 py-3">
      <Avatar className="h-8 w-8 shrink-0">
        {getAvatarUrl(comment.user.name) && <AvatarImage src={getAvatarUrl(comment.user.name)} />}
        <AvatarFallback className="text-[10px]">{getInitials(comment.user.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">{comment.user.name}</span>
          <span className="text-xs text-muted-foreground">{timeAgo(comment.timestamp)}</span>
        </div>
        {hasText && (
          <div
            className="comment-html text-sm text-foreground/90 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: comment.html }}
          />
        )}
        {comment.attachments && comment.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1.5">
            {comment.attachments.map((file) => {
              const Icon = getFileIcon(file.type)
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2 max-w-[260px] hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  {file.previewUrl ? (
                    <img src={file.previewUrl} alt="" className="h-9 w-9 rounded object-cover shrink-0" />
                  ) : (
                    <div className="flex items-center justify-center h-9 w-9 rounded bg-muted shrink-0">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── ToolbarBtn ─── */

const ToolbarBtn = forwardRef<HTMLButtonElement, {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  title?: string
  preventFocusLoss?: boolean
}>(({ children, active, onClick, title, preventFocusLoss = true }, ref) => (
  <button
    ref={ref}
    type="button"
    onMouseDown={preventFocusLoss ? (e) => e.preventDefault() : undefined}
    onClick={onClick}
    title={title}
    className={cn(
      "flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground transition-colors",
      active ? "bg-accent text-foreground" : "hover:bg-accent/50 hover:text-foreground",
    )}
  >
    {children}
  </button>
))
ToolbarBtn.displayName = "ToolbarBtn"
