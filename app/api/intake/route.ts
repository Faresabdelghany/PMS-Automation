import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServiceClient } from "@/lib/supabase-server"

const intakeSchema = z.object({
  title: z.string().min(1, "title is required"),
  category: z.string().default("Work"),
  priority: z.string().default("High"),
  assignee: z.string().default("Ziko"),
  status: z.string().default("todo"),
  description: z.string().default(""),
  tag: z.string().default(""),
  source: z.string().default("telegram"),
  source_channel: z.string().default("telegram"),
  source_message_id: z.string().optional(),
  source_ts: z.string().optional(),
  workflow_stage: z.string().default("PA"),
  task_type: z.enum(["user_task", "agent_task", "system_task"]).default("user_task"),
  created_by_user: z.string().default("Fares"),
  created_by_agent: z.string().default("Ziko"),
})

export async function POST(req: NextRequest) {
  // Authenticate
  const auth = req.headers.get("authorization")
  const expected = `Bearer ${process.env.INTAKE_API_SECRET}`
  if (!auth || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Parse + validate
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = intakeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const data = parsed.data

  // Deduplicate by source_message_id
  const supabase = createServiceClient()
  if (data.source_message_id) {
    const { data: existing } = await supabase
      .from("todos")
      .select("id")
      .eq("source_message_id", data.source_message_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ id: existing.id, deduplicated: true })
    }
  }

  // Insert
  const { data: row, error } = await supabase
    .from("todos")
    .insert({
      title: data.title,
      category: data.category,
      priority: data.priority,
      assignee: data.assignee,
      status: data.status,
      description: data.description,
      tag: data.tag,
      source: data.source,
      source_channel: data.source_channel,
      source_message_id: data.source_message_id ?? null,
      source_ts: data.source_ts ?? null,
      workflow_stage: data.workflow_stage,
      task_type: data.task_type,
      created_by_user: data.created_by_user,
      created_by_agent: data.created_by_agent,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[intake] Supabase insert error:", error)
    return NextResponse.json(
      { error: "Insert failed", details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ id: row.id }, { status: 201 })
}
