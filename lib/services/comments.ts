import { supabase } from "@/lib/supabase"

// ---------- Types ----------

export type CommentRow = {
  id: string
  todo_id: string
  author: string
  html: string
  created_at: string
}

export type AppComment = {
  id: string
  user: { name: string }
  timestamp: Date
  html: string
}

// ---------- Mapping ----------

function rowToComment(row: CommentRow): AppComment {
  return {
    id: row.id,
    user: { name: row.author },
    timestamp: new Date(row.created_at),
    html: row.html,
  }
}

// ---------- CRUD ----------

export async function fetchComments(todoId: string): Promise<AppComment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("todo_id", todoId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("fetchComments error:", error)
    return []
  }

  return (data as CommentRow[]).map(rowToComment)
}

export async function createComment(
  todoId: string,
  author: string,
  html: string,
): Promise<AppComment | null> {
  const { data, error } = await supabase
    .from("comments")
    .insert({ todo_id: todoId, author, html })
    .select()
    .single()

  if (error) {
    console.error("createComment error:", error)
    return null
  }

  return rowToComment(data as CommentRow)
}
