import { supabase } from "@/lib/supabase"

export type SubtaskRow = {
  id: string
  todo_id: string
  name: string
  note: string | null
  done: boolean
  created_at: string
}

export type AppSubtask = {
  id: string
  name: string
  note?: string
  done: boolean
}

function rowToSubtask(row: SubtaskRow): AppSubtask {
  return {
    id: row.id,
    name: row.name,
    note: row.note ?? undefined,
    done: row.done,
  }
}

export async function fetchSubtasks(todoId: string): Promise<AppSubtask[]> {
  const { data, error } = await supabase
    .from("subtasks")
    .select("*")
    .eq("todo_id", todoId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("fetchSubtasks error:", error)
    return []
  }

  return (data as SubtaskRow[]).map(rowToSubtask)
}

export async function createSubtask(todoId: string, name: string, note?: string): Promise<AppSubtask | null> {
  const { data, error } = await supabase
    .from("subtasks")
    .insert({ todo_id: todoId, name, note: note ?? null })
    .select()
    .single()

  if (error) {
    console.error("createSubtask error:", error)
    return null
  }

  return rowToSubtask(data as SubtaskRow)
}

export async function updateSubtask(id: string, updates: Partial<AppSubtask>): Promise<AppSubtask | null> {
  const payload: Partial<SubtaskRow> = {}
  if (updates.name !== undefined) payload.name = updates.name
  if (updates.note !== undefined) payload.note = updates.note ?? null
  if (updates.done !== undefined) payload.done = updates.done

  const { data, error } = await supabase
    .from("subtasks")
    .update(payload)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("updateSubtask error:", error)
    return null
  }

  return rowToSubtask(data as SubtaskRow)
}

export async function deleteSubtask(id: string): Promise<boolean> {
  const { error } = await supabase.from("subtasks").delete().eq("id", id)
  if (error) {
    console.error("deleteSubtask error:", error)
    return false
  }
  return true
}
