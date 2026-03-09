# MEMORY.md — Ziko's Long-Term Memory

## About Fares
- Real name: Abdelaziz, goes by **Fares**
- Timezone: Africa/Cairo
- Reached out via Telegram
- Hands-on technical user — gives precise, detailed instructions
- OS: Windows 10 (x64)
- SilverKey Tech = Fares's EMPLOYER, not his business. Never reference as his company.

## Setup
- OpenClaw v2026.2.22-2
- Default model: `anthropic/claude-opus-4-6`
- Auth: single `anthropic:manual` token profile (setup-token flow)
- Gateway: `localhost:18789`, local mode, no service manager
- Telegram bot: `@Fares_Agents_bot`, polling mode
- PowerShell quirk: execution policy blocks .ps1 — use `openclaw.cmd` or `cmd /c`

## The Mission
- **Goal: $10M software business**
- Revenue streams: Client work (landing pages, websites, SaaS) + Own products (FlashInference + future)
- Ziko is the main orchestrator talking to Fares

## Products
- **FlashInference**: Desktop app for local AI inference (Tauri v2) — not yet started
- **Client Work**: High-volume landing pages, websites, SaaS builds

## Agent Architecture (v4 — lean, 2026-02-27, updated 2026-03-06)
**Total: 8 agents**

Hierarchy:
- Fares → Ziko (orchestrator)
- Ziko → Product Analyst (brain — runs SpecKit, consults others)
- Product Analyst ↔ Marketing Agent (on-call)
- Product Analyst ↔ Designer (on-call)
- Ziko → Dev (implements tasks.md via Codex)
- Ziko → Testing Agent (validates Dev output)
- Ziko → Code Reviewer (final review, fixes directly)
- Ziko → Job Search Agent (job applications)

Pipeline: `Fares → Ziko → Product Analyst → Dev → Testing Agent → Code Reviewer → Ziko → Fares`
- No approval gates — full autonomy
- Product Analyst runs SpecKit in Claude Code (`--dangerously-skip-permissions`)
- Dev runs Codex `openai-codex/gpt-5.3-codex` (`--full-auto` or `--yolo`) — ONLY Codex, never Claude Code. Fallback: claude-sonnet-4-6
- Testing Agent runs Claude Code (`--dangerously-skip-permissions`) + Playwright
- Code Reviewer runs Claude Code with `/review`
- Hard rule: Ziko must NOT dispatch Dev directly. Dev work only starts after Product Analyst SpecKit handoff.
- Hard rule: every Dev output must pass through Testing Agent before Code Reviewer sign-off.
- Autopilot rule: once Fares provides a goal, Ziko must continue the full workflow chain automatically.

Routing rules:
- All product/feature/automation requests → Ziko → Product Analyst first
- Designer only called when UI/UX is needed
- Marketing Agent only called for copy, SEO, messaging, campaigns
- Job Search Agent handles only job-search tasks
- Dev only builds what Product Analyst specified
- Testing Agent validates and returns bugs to Dev if needed
- Code Reviewer performs final review and fixes issues directly

Prompts at: `~/.openclaw/workspace/agents/prompts-v2/`
Old 24-agent prompts archived at: `~/.openclaw/workspace/agents/prompts/`

## Key Lessons
- **Sub-agent outputs**: ALWAYS instruct sub-agents to write reports to files. Auto-announced results get lost. Files persist.
- **Pipeline responsibility**: Ziko owns the orchestration chain. No shortcuts.
- **Spawning without review pipeline = broken workflow**: Always plan the full pipeline upfront.
- Next.js 16 Turbopack crashes on Windows (PostCSS `nul` bug) — use Next.js 15 or wait for fix
- Gateway pairing fix: delete `~/.openclaw/identity/device-auth.json` + `~/.openclaw/devices/paired.json`
- `sessions_spawn` fix: set `gateway.auth.mode` to `"none"` (safe on loopback)
- Supermemory search uses `q` field (not `query`)
- **Browser automation resilience**: LinkedIn/long browser sessions timeout frequently. Always set explicit timeouts, checkpoint progress, and design for partial-completion recovery (don't lose 65 URLs to a single timeout)

## Telegram Group: "Fares and Agents 🤓"
- Chat ID: `-1003815755547`
- Forum group with per-agent topics (threads)
- Bot: `@Fares_Agents_bot` (polling mode)

| Agent | Thread ID |
|---|---|
| ⚡ Ziko | 2 |
| 🧠 Product Analyst | 4 |
| 🛠️ Dev | 6 |
| 🧪 Testing Agent | 8 |
| 🔍 Code Reviewer | 10 |
| 🎨 Designer | 12 |
| 📣 Marketing | 14 |
| 💼 Job Search Agent | 209 |

## Job Search Agent — Added 2026-03-04
- OpenClaw agent id: `job-search` (bound to topic 209)
- Prompt: `workspace/agents/prompts-v2/job-search.md`
- Skills: `job-auto-apply`, `linkedin-browser`, `linkedin-api`, `gog` (Gmail drafts), `humanizer`

## MCP Servers + Power Tools — Implemented 2026-03-03
- **Context7** — live docs for Next.js/React
- **Playwright MCP** — write+run tests (Testing Agent)
- **GitHub MCP** — PR management, CI logs (Reviewer + Testing)
- Humanizer skill: `C:\Users\Fares\.agents\skills\humanizer` (v2.1.1)
- Code Reviewer tiered policy: Sonnet standard, Opus for auth/payments/RLS code

## Orchestration Rules — Implemented 2026-03-03
1. **Context Package** — every Ziko dispatch uses canonical schema at `/docs/templates/context-package-template.md`
2. **Escalation triggers** — defined per agent in their prompts
3. **Iteration limits** — Dev max 3 cycles, Testing max 10 bugs, Reviewer 24h

## Message Prefix Rule (2026-03-03)
Every agent MUST prefix every message with their name and emoji. No exceptions.

## AI System Prompts Reference (2026-02-23)
- Repo: https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools
- **3 rules every elite agent has:**
  1. "Keep going until the task is completely resolved"
  2. "Never guess — use your tools to read files and gather info"
  3. "Never mention tool names to users — speak in natural language"

## Workspace GitHub Repo
- URL: https://github.com/Faresabdelghany/PMS-Automation
- Remote: origin, branch: master
- First full push: 2026-03-09 (commit 71e0760)

## PA→Dev→Tester→Reviewer Workflow Contract (2026-03-09)
- **Canonical chain**: User → Ziko → PA → PMS child task creation → Dev ↔ Tester ↔ PA loop → Reviewer → PA → Ziko → User
- **DB migration**: `20260309022500_child_task_workflow_contract.sql` — adds parent_task_id, order_index, source, acceptance_criteria, lifecycle_status to todos
- **Lifecycle**: queued → ready → in_progress → dev_done → in_test → tested_passed → in_review → done (+ changes_requested, failed, cancelled)
- **Enforcement**: unique constraint = one active child per parent; idempotent speckit import by (parent_task_id, order_index)
- **Key scripts**:
  - `ingest-speckit-decomposition.ps1` — single approved PA→PMS ingestion path
  - `verify-pa-spec-gate.ps1` — blocks Dev if artifacts/queue invalid
  - `transition-child-task.ps1` — role-based transitions + sequential unlock
  - `run-feature-workflow.ps1` — orchestrator entrypoint
- **Docs**: INGESTION-SCHEMA.md, REVIEWER-POLICY.md, WORKFLOW-PA-DEV-TEST-REVIEW.md
- **Reviewer policy**: low-risk = fast-track (tested_passed→done), standard = in_review gate
- **Lesson**: Fares wants delta-only reports. Never restate completed work.

## First session: 2026-02-20
- Bootstrapped identity, migrated auth, configured Opus 4.6

## Task Management System (PMS-Automation)
- Tasks page at `C:\Users\Fares\PMS-Automation` wired to real Supabase `todos` table
- Real agent assignees (8 agents) replace placeholder names
- Activities tab shows agent_logs linked by todo_id
- Comments table for agent handoff trail
- Subtasks table for persistent subtask tracking

### Automation Pipeline (2026-03-06)
- **Auto-intake**: every inbound message → creates `todos` row (deduped by source_message_id)
- **Auto-assign**: keyword intent classifier maps task title → correct agent (always overrides manual)
- **Auto-dispatch**: realtime listener runs task-watcher.ps1 on dispatchable tasks + wakes Ziko
- **10-min cron sweep**: system event `RUN_STATUS_SWEEP` checks open task progress
- **Comment handoffs**: agents must post summaries + @mention next agent in pipeline
- **Activity tracking**: structured `created_by_user/agent`, `updated_by_user/agent`, `last_update_summary`, `workflow_stage`
- **Log gate**: `log-agent-task.ps1` requires TodoId; logs rejected without linked task

### Observability Schema (2026-03-07)
- **agent_runs** — execution sessions (status, input, output, error, timing)
- **task_events** — user-facing timeline (event_type, actor, summary, metadata)
- **tool_invocations** — tool call observability
- **skill_invocations** — skill usage observability
- Extended `agent_logs` with run_id, event_type, level, error_message, completed_at
- Extended `todos` with current_run_id, last_event_at, failed_at, completed_at, archived_at
- DISPATCH-FOOTER now has 9-step execution protocol (create run → emit events → work → update todo → complete run → emit completion → comment → log → reply)
- Helper scripts: `create-agent-run.ps1`, `update-agent-run.ps1`, `emit-task-event.ps1`

### Key Scripts
- `intake-request.ps1` — auto-intake + auto-assign + create todo
- `auto-assign.ps1` — keyword intent classifier
- `task-watcher.ps1` — claim unclaimed tasks
- `task-realtime.mjs` — Supabase Realtime listener (auto-assign + auto-dispatch + wake)
- `task-status-sweep.ps1` — periodic status check
- `add-comment.ps1` — insert task comments
- `create-todo.ps1`, `update-todo.ps1`, `create-subtask.ps1` — CRUD helpers
- `log-agent-task.ps1` — mandatory agent logging (requires TodoId)

### Tooling
- Supabase CLI: `npx supabase` (v2.77.0, no global install)
- Future migrations: `npx supabase db push` (not browser SQL editor)


