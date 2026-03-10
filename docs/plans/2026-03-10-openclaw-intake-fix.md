# OpenClaw Intake Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a POST `/api/intake` endpoint in PMS so OpenClaw Telegram messages reach Supabase reliably, replacing fragile direct-write scripts.

**Architecture:** A Next.js API route authenticates via bearer token, validates with Zod, and writes to Supabase using the service role key (bypassing RLS). The OpenClaw `intake-request.ps1` script switches from calling `create-todo.ps1` (direct Supabase REST) to POSTing to this endpoint. A migration adds `'telegram'` to the `todos_source_check` constraint.

**Tech Stack:** Next.js 16 App Router, Supabase JS v2, Zod 4.3.6, PowerShell 5.1+

---

## Task 1: Add `'telegram'` to `todos_source_check` constraint

**Files:**
- Create: `supabase/migrations/20260310060000_add_telegram_source.sql`

**Step 1: Write the migration**

```sql
-- Add 'telegram' to the allowed source values
alter table public.todos
  drop constraint if exists todos_source_check;

alter table public.todos
  add constraint todos_source_check
  check (source in ('manual','speckit','system','agent','telegram'));
```

**Step 2: Run the migration against Supabase**

Run in Supabase SQL Editor (Dashboard → SQL Editor → New query):
```sql
alter table public.todos
  drop constraint if exists todos_source_check;

alter table public.todos
  add constraint todos_source_check
  check (source in ('manual','speckit','system','agent','telegram'));
```

Expected: `Success. No rows returned.`

**Step 3: Verify the constraint**

Run in SQL Editor:
```sql
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.todos'::regclass
  and conname = 'todos_source_check';
```

Expected: One row showing `source` includes `'telegram'`.

**Step 4: Commit**

```bash
cd /c/Users/Fares/PMS-Automation
git add supabase/migrations/20260310060000_add_telegram_source.sql
git commit -m "migration: add 'telegram' to todos_source_check constraint"
```

---

## Task 2: Add env vars to `.env.local`

**Files:**
- Modify: `.env.local`

**Step 1: Append the two new env vars**

Add these lines to the end of `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc1NzU3NSwiZXhwIjoyMDg4MzMzNTc1fQ.eehH97vAd8w-aM5GToyHqHqz51DkA8wuxDeiF7nbOJk
INTAKE_API_SECRET=sk_openclaw_2026
```

**Step 2: Verify `.env.local` is gitignored**

```bash
cd /c/Users/Fares/PMS-Automation
grep '.env.local' .gitignore
```

Expected: `.env.local` is listed.

**Step 3: No commit** — `.env.local` is gitignored. These same vars must be added to Vercel dashboard manually later.

---

## Task 3: Create the server-side Supabase client helper

**Files:**
- Create: `lib/supabase-server.ts`

**Step 1: Write the server client**

```typescript
import { createClient } from "@supabase/supabase-js"

/**
 * Server-side Supabase client using service role key.
 * Bypasses RLS — only use in server-side API routes.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }
  return createClient(url, key)
}
```

**Step 2: Commit**

```bash
cd /c/Users/Fares/PMS-Automation
git add lib/supabase-server.ts
git commit -m "feat: add server-side Supabase client with service role key"
```

---

## Task 4: Build the `/api/intake` POST endpoint

**Files:**
- Create: `app/api/intake/route.ts`

**Step 1: Create the API route directory**

```bash
mkdir -p /c/Users/Fares/PMS-Automation/app/api/intake
```

**Step 2: Write the route handler**

```typescript
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
```

**Step 3: Verify it compiles**

```bash
cd /c/Users/Fares/PMS-Automation
npx tsc --noEmit app/api/intake/route.ts
```

Expected: no errors (or only pre-existing unrelated errors).

**Step 4: Commit**

```bash
cd /c/Users/Fares/PMS-Automation
git add app/api/intake/route.ts
git commit -m "feat: add POST /api/intake endpoint for OpenClaw task intake"
```

---

## Task 5: Update `intake-request.ps1` to POST to the new endpoint

**Files:**
- Modify: `C:\Users\Fares\.openclaw\workspace\scripts\intake-request.ps1`

**Step 1: Rewrite the script**

Replace the entire file with:

```powershell
param(
  [Parameter(Mandatory=$true)][string]$Title,
  [Parameter(Mandatory=$false)][string]$Category = "Work",
  [Parameter(Mandatory=$false)][string]$Priority = "High",
  [Parameter(Mandatory=$false)][string]$Assignee = "Ziko",
  [Parameter(Mandatory=$false)][string]$SourceMessageId,
  [Parameter(Mandatory=$false)][string]$SourceChannel = "telegram",
  [Parameter(Mandatory=$false)][string]$SourceTs,
  [Parameter(Mandatory=$false)][string]$CreatedByUser = "Fares",
  [Parameter(Mandatory=$false)][string]$CreatedByAgent = "Ziko",
  [Parameter(Mandatory=$false)][ValidateSet("user_task","agent_task","system_task")][string]$TaskType = "user_task"
)

# ── Config ──────────────────────────────────────────────────
$PMS_URL   = "https://pms-automation.vercel.app"  # TODO: replace with real Vercel URL
$API_SECRET = "sk_openclaw_2026"
$scriptsDir = "C:\Users\Fares\.openclaw\workspace\scripts"

# ── Auto-assign based on intent ─────────────────────────────
$lower = $Title.ToLowerInvariant()
$finalAssignee = $Assignee
$finalStage = "PA"
$finalCategory = $Category
if     ($lower -match "design|ui|ux|figma|layout|mockup")                              { $finalAssignee = "Designer";         $finalStage = "SPECIALIST"; $finalCategory = "Work" }
elseif ($lower -match "test|qa|bug|regression|unit test|integration test")              { $finalAssignee = "Testing Agent";    $finalStage = "TEST";       $finalCategory = "Development" }
elseif ($lower -match "review|audit|security|code review")                             { $finalAssignee = "Code Reviewer";    $finalStage = "REVIEW";     $finalCategory = "Development" }
elseif ($lower -match "marketing|seo|copy|launch|campaign|newsletter")                 { $finalAssignee = "Marketing Agent";  $finalStage = "SPECIALIST"; $finalCategory = "Marketing" }
elseif ($lower -match "job|apply|resume|cv|interview")                                 { $finalAssignee = "Job Search Agent"; $finalStage = "SPECIALIST"; $finalCategory = "Work" }
elseif ($lower -match "research|spec|requirements|analysis|plan")                      { $finalAssignee = "Product Analyst";  $finalStage = "PA";         $finalCategory = "Work" }
elseif ($lower -match "build|implement|feature|refactor|api|backend|frontend|fix|bugfix|ship") { $finalAssignee = "Dev"; $finalStage = "DEV"; $finalCategory = "Development" }

# ── Build payload ────────────────────────────────────────────
$payload = @{
  title          = $Title
  category       = $finalCategory
  priority       = $Priority
  assignee       = $finalAssignee
  source         = "telegram"
  source_channel = $SourceChannel
  workflow_stage = $finalStage
  task_type      = $TaskType
  created_by_user  = $CreatedByUser
  created_by_agent = $CreatedByAgent
}
if ($SourceMessageId) { $payload.source_message_id = $SourceMessageId }
if ($SourceTs)        { $payload.source_ts         = $SourceTs }

$body = $payload | ConvertTo-Json -Compress
$headers = @{
  Authorization  = "Bearer $API_SECRET"
  "Content-Type" = "application/json"
}

# ── POST to PMS intake endpoint ──────────────────────────────
try {
  $res = Invoke-RestMethod -Uri "$PMS_URL/api/intake" -Method Post -Headers $headers -Body $body -ErrorAction Stop
  $todoId = $res.id
} catch {
  Write-Error "Intake POST failed: $_"
  exit 1
}

if (-not $todoId -or $todoId -notmatch '^[0-9a-f\-]{36}$') {
  Write-Error "Intake returned unexpected response: $($res | ConvertTo-Json -Compress)"
  exit 1
}

# ── Emit task_created event ──────────────────────────────────
try {
  powershell -ExecutionPolicy Bypass -File "$scriptsDir\emit-task-event.ps1" `
    -TodoId $todoId -EventType "task_created" -ActorType "user" -ActorName $CreatedByUser `
    -Summary "Task created via Telegram: $Title (assigned to $finalAssignee)"
} catch {
  Write-Warning "Failed to emit task_created event: $_"
}

Write-Host $todoId
```

**Step 2: Verify syntax**

```powershell
powershell -ExecutionPolicy Bypass -Command "& { Get-Content 'C:\Users\Fares\.openclaw\workspace\scripts\intake-request.ps1' | Out-Null; Write-Host 'Syntax OK' }"
```

**Step 3: No git commit** — OpenClaw scripts are in a separate repo (`~/.openclaw/workspace`).

---

## Task 6: End-to-end test

**Step 1: Start the dev server**

```bash
cd /c/Users/Fares/PMS-Automation
npm run dev
```

**Step 2: Test the endpoint with curl**

```bash
curl -s -X POST http://localhost:3000/api/intake \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_openclaw_2026" \
  -d '{"title":"Test from curl","source":"telegram","source_channel":"telegram"}' | jq .
```

Expected: `{ "id": "<uuid>" }` with status 201.

**Step 3: Verify the row in Supabase**

Run in SQL Editor:
```sql
select id, title, source, source_channel, assignee, workflow_stage
from todos
where title = 'Test from curl';
```

Expected: One row with `source = 'telegram'`, `source_channel = 'telegram'`.

**Step 4: Test auth rejection**

```bash
curl -s -X POST http://localhost:3000/api/intake \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wrong_key" \
  -d '{"title":"Should fail"}' | jq .
```

Expected: `{ "error": "Unauthorized" }` with status 401.

**Step 5: Test deduplication**

```bash
curl -s -X POST http://localhost:3000/api/intake \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_openclaw_2026" \
  -d '{"title":"Dedup test","source":"telegram","source_channel":"telegram","source_message_id":"test-dedup-123"}' | jq .
```

Run twice. Expected: second call returns `{ "id": "<same-uuid>", "deduplicated": true }`.

**Step 6: Test from PowerShell**

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\intake-request.ps1" -Title "Test from PowerShell" -SourceMessageId "ps-test-001" -SourceChannel "telegram"
```

Expected: prints a UUID.

**Step 7: Clean up test rows**

```sql
delete from todos where title in ('Test from curl', 'Dedup test', 'Test from PowerShell');
```

**Step 8: Final commit**

```bash
cd /c/Users/Fares/PMS-Automation
git add -A
git commit -m "feat: OpenClaw intake pipeline — API endpoint + migration + env setup"
```

---

## Post-Implementation Checklist

- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` and `INTAKE_API_SECRET` to Vercel dashboard (Settings → Environment Variables)
- [ ] Deploy to Vercel and update `$PMS_URL` in `intake-request.ps1` with actual production URL
- [ ] Send a real Telegram message to `@Fares_Agents_bot` and verify it appears in PMS UI
