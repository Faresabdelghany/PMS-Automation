# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run lint     # ESLint
npm run start    # Start production server
```

No test suite exists yet.

TypeScript is still configured in `next.config.mjs` with `typescript.ignoreBuildErrors: true` for deploy continuity,
but local discipline now expects `npx tsc --noEmit` to pass during feature work.

## Dependencies

**Current versions (last updated: 2026-02-27):**
- Next.js: **16.1.6** (with Turbopack)
- React: **19.2.4**
- TypeScript: **5.x**
- Tailwind CSS: **4.2.1**
- Zod: **4.3.6**
- React Hook Form: **7.71.2**
- Radix UI: Latest versions (1.x - 2.x range)
- Tiptap: **3.20.0**
- Recharts: **3.7.0**

All dependencies are kept up to date with latest stable versions.

## Architecture

**Next.js 16 App Router with Supabase-backed data.**

- Tasks are live from Supabase (`todos`, `subtasks`, `comments`, `task_events`, `agent_logs`).
- Task classification is enforced by `todos.task_type` (`user_task`, `agent_task`, `system_task`).
- User-facing tasks query via `v_user_tasks`; internal/system visibility remains in internal views.
- Projects are live from Supabase `projects` table.
- Project-task linking is via `todos.project_id -> projects.id`.

### Route → Component Pattern

Every page follows the same shell: `SidebarProvider > AppSidebar + SidebarInset > Suspense > <ContentComponent>`. Pages are server components; all content components are `"use client"`.

| Route | Content Component |
|---|---|
| `/` | `ProjectsContent` (orchestrates three views) |
| `/tasks` | `MyTasksPage` |
| `/clients` | `ClientsContent` |
| `/clients/:id` | `ClientDetailsPage` |
| `/inbox` | `InboxPage` |
| `/performance` | `PerformanceContent` |
| `/projects/:id` | `ProjectDetailsPage` (live project + linked tasks from Supabase) |

**Next.js 16 gotcha:** Route params are a `Promise` - use `const { id } = await params` in server components.

### Three View Implementations (Projects Page)

`ProjectsContent` holds view state and renders the active view:

- **List** (`ProjectCardsView`): Responsive CSS grid of `ProjectCard` components.
- **Board** (`ProjectBoardView`): Kanban columns using **native HTML5 drag-and-drop** (not dnd-kit). Four fixed columns: backlog/planned/active/completed.
- **Timeline** (`ProjectTimeline`): Custom Gantt chart built with raw pointer events and date-fns. Uses real current date as "today" marker. Has a separate mobile rendering path (accordion).

### Three DnD Systems (Do Not Mix)

1. **HTML5 native** (`draggable`/`onDragStart`/`onDrop`) - `ProjectBoardView`
2. **dnd-kit** (`@dnd-kit/core` + `@dnd-kit/sortable`) - `WorkstreamTab`, `MyTasksPage`, `TaskWeekBoardView`
3. **Custom pointer events** - `DraggableBar` in `ProjectTimeline`

### Filter Pipeline

Three layers: URL params ↔ `FilterChip[]` ↔ filtered data.

- `lib/url/filters.ts`: `chipsToParams()`/`paramsToChips()` convert between `FilterChip` arrays and URL search params.
- `FilterPopover`: Two-panel UI with staged temp state, applies on confirm.
- `ProjectsContent`: Uses `isSyncingRef` + `prevParamsRef` to prevent URL ↔ state feedback loops.

### Data Layer

Hybrid type/service layer:
- `lib/services/tasks.ts`: live task CRUD/query paths from Supabase
- `lib/services/projects.ts`: live project create/read and project detail mapping
- `lib/data/projects.ts`: shared `Project` type + `computeFilterCounts()` utility (no runtime source of truth)
- `lib/data/project-details.ts`: shared detailed types (legacy helper retained but deprecated)
- `lib/data/sidebar.ts`: static nav metadata
- `lib/data/clients.ts`: client records used by UI pickers

### OpenClaw / Telegram Integration

**This is the core automation loop of the entire system.**

```
Fares (Telegram) → OpenClaw → Supabase → PMS UI
                                 ↑
              Agents write back their activity here
```

- **Task intake**: Every message Fares sends to OpenClaw via Telegram (`@Fares_Agents_bot`) is auto-classified and inserted as a task into the `todos` table (`source: "telegram"`, `source_channel: "telegram"`, `source_message_id` set).
- **Agent activity**: As OpenClaw agents work (PA, Dev, Reviewer, Specialist, etc.), they write their execution state back to Supabase — `agent_runs`, `agent_logs`, `task_events`, `tool_invocations`, `skill_invocations`. PMS reads and displays all of this in real-time.
- **Real-time display**: The `/agents` page and task detail panels surface live agent runs, events, and logs. Supabase Realtime is enabled on `agent_runs`, `task_events`, `todos`.
- **Workflow stages**: Tasks move through `workflow_stage` values (`PA → DEV → REVIEW → SPECIALIST`) as agents pick them up and advance them.
- **Lifecycle tracking**: `lifecycle_status` on `todos` reflects where a task is in the agent pipeline (`queued → in_progress → dev_done → tested_passed → done`).
- **`current_run_id`**: Active agent run is tracked on the task itself so the UI can link directly to the live run.

**Tables that OpenClaw writes to (do not break their schema):**
- `todos` — creates + updates tasks
- `agent_runs` — one row per agent execution
- `agent_logs` — detailed log entries per run
- `task_events` — event stream (PA assigned, dev started, review requested, etc.)
- `tool_invocations` — each tool call within a run
- `skill_invocations` — each skill invoked within a run
- `inbox_notifications` — alerts pushed to the inbox page

### Observability Tables

Supabase operational tables in active use:
- `agent_runs`
- `task_events`
- `agent_logs`
- `tool_invocations`
- `skill_invocations`

These are written by OpenClaw and read by PMS. Must not be removed or bypassed.

### Component Organization

- `components/ui/` - Shadcn/Radix primitives (do not modify directly unless restyling)
- `components/<feature>/` - Feature-specific components (projects/, tasks/, clients/, inbox/, project-wizard/)
- `components/<feature-name>.tsx` - Top-level feature components
- `components/task-helpers.tsx` - Shared task utilities: `filterTasksByChips`, `computeTaskFilterCounts`, `ProjectTasksSection`, `TaskRowDnD`

## Key Conventions

- **Path aliases**: Always use `@/components`, `@/lib`, `@/hooks` (configured in tsconfig.json)
- **Icons**: Import Phosphor from `@phosphor-icons/react/dist/ssr` (SSR-safe). Lucide also available.
- **Animations**: Import from `"motion/react"` (not `"framer-motion"`). Common: `AnimatePresence mode="wait"` for step transitions, spring transitions for panels.
- **Styling**: Tailwind 4 with `oklch` color tokens in `globals.css`. No `tailwind.config.ts` - all config is `@theme inline` in CSS. Use `cn()` from `lib/utils.ts` for conditional classes.
- **Shadcn config**: Style `new-york`, base color `neutral` (see `components.json`)
- **Responsive**: `useIsMobile()` hook (768px breakpoint) for JS logic; Tailwind `sm:`/`md:`/`lg:` for CSS
- **State**: React hooks only - no global state library. Filter state persisted to URL via `router.replace()`
- **Forms**: React Hook Form + Zod validation
- **Fonts**: Geist + Geist Mono loaded in root layout via `next/font/google`

## Governance

The `.specify/memory/constitution.md` (v1.1.0) is the canonical authority. It defines 7 principles: Component-First Design, Type Safety, Accessibility, Visual Polish, Simplicity (YAGNI), Responsive Design, Consistent Patterns.

**Recent Updates (v1.1.0, 2026-02-27):**
- All dependencies upgraded to latest stable versions
- Recharts updated from 2.x to 3.x (constitution amended)
- Next.js 16.1.6 with Turbopack improvements
- React 19.2.4 with latest bug fixes
- All Radix UI components updated
- Zod 4.3.6 with improved type inference

Core dependencies are version-locked to major versions and require a constitution amendment for major version changes.
