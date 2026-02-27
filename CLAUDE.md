# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run lint     # ESLint
npm run start    # Start production server
```

No test suite exists yet. TypeScript build errors are ignored in `next.config.mjs` (`typescript.ignoreBuildErrors: true`).

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

**Frontend-only Next.js 16.1.6 App Router project.** No backend, no database. All data is static mock data in `lib/data/`.

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
| `/projects/:id` | `ProjectDetailsPage` (simulates 600-900ms loading delay) |

**Next.js 16 gotcha:** Route params are a `Promise` — use `const { id } = await params` in server components.

### Three View Implementations (Projects Page)

`ProjectsContent` holds view state and renders the active view:

- **List** (`ProjectCardsView`): Responsive CSS grid of `ProjectCard` components.
- **Board** (`ProjectBoardView`): Kanban columns using **native HTML5 drag-and-drop** (not dnd-kit). Four fixed columns: backlog/planned/active/completed.
- **Timeline** (`ProjectTimeline`): Custom Gantt chart built with raw pointer events and date-fns. Uses a fixed date `new Date(2024, 0, 23)` as "today". Has a completely separate mobile rendering path (accordion).

### Three DnD Systems (Do Not Mix)

1. **HTML5 native** (`draggable`/`onDragStart`/`onDrop`) — `ProjectBoardView`
2. **dnd-kit** (`@dnd-kit/core` + `@dnd-kit/sortable`) — `WorkstreamTab`, `MyTasksPage`, `TaskWeekBoardView`
3. **Custom pointer events** — `DraggableBar` in `ProjectTimeline`

### Filter Pipeline

Three layers: URL params ↔ `FilterChip[]` ↔ filtered data.

- `lib/url/filters.ts`: `chipsToParams()`/`paramsToChips()` convert between `FilterChip` arrays and URL search params.
- `FilterPopover`: Two-panel UI with staged temp state, applies on confirm.
- `ProjectsContent`: Uses `isSyncingRef` + `prevParamsRef` to prevent URL ↔ state feedback loops.

### Data Layer

All in `lib/data/` — static arrays with TypeScript types:
- `projects.ts`: `Project[]` + `computeFilterCounts()`
- `project-details.ts`: Extended `ProjectDetails` type + `getProjectDetailsById()` + `getProjectTasks()`
- `sidebar.ts`: Nav items (static, not linked to live projects data)
- `clients.ts`: Client records

### Component Organization

- `components/ui/` — Shadcn/Radix primitives (do not modify directly unless restyling)
- `components/<feature>/` — Feature-specific components (projects/, tasks/, clients/, inbox/, project-wizard/)
- `components/<feature-name>.tsx` — Top-level feature components
- `components/task-helpers.tsx` — Shared task utilities: `filterTasksByChips`, `computeTaskFilterCounts`, `ProjectTasksSection`, `TaskRowDnD`

## Key Conventions

- **Path aliases**: Always use `@/components`, `@/lib`, `@/hooks` (configured in tsconfig.json)
- **Icons**: Import Phosphor from `@phosphor-icons/react/dist/ssr` (SSR-safe). Lucide also available.
- **Animations**: Import from `"motion/react"` (not `"framer-motion"`). Common: `AnimatePresence mode="wait"` for step transitions, spring transitions for panels.
- **Styling**: Tailwind 4 with `oklch` color tokens in `globals.css`. No `tailwind.config.ts` — all config is `@theme inline` in CSS. Use `cn()` from `lib/utils.ts` for conditional classes.
- **Shadcn config**: Style `new-york`, base color `neutral` (see `components.json`)
- **Responsive**: `useIsMobile()` hook (768px breakpoint) for JS logic; Tailwind `sm:`/`md:`/`lg:` for CSS
- **State**: React hooks only — no global state library. Filter state persisted to URL via `router.replace()`
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
