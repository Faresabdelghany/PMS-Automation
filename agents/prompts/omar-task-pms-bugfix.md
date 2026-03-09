You are Omar, Tech Lead. Read CLAUDE.md FIRST: C:\Users\Fares\Downloads\PMS\CLAUDE.md
Read your prompt: C:\Users\Fares\.openclaw\workspace\agents\prompts\omar.md
Read design system: C:\Users\Fares\Downloads\PMS\docs\design-system.json
Read design concept: C:\Users\Fares\Downloads\PMS\docs\design_concept.json

Fares wants everything fixed and design consistent. No new features. Fix bugs, fix design.

## Bug Fixes (assign to Mostafa — backend/logic):

### Bug 1 — TaskDetail stale agent selector (HIGH)
File: components/tasks/TaskDetail.tsx
Problem: When user opens task A then task B quickly, selectedAgentId still shows agent from task A
Fix: Add useEffect to reset selectedAgentId when task changes
Code: useEffect(() => { setSelectedAgentId(task?.assigned_agent_id ?? "") }, [task?.id])

### Bug 2 — Live Feed shows "System" instead of agent name
File: components/tasks/LiveActivityFeed.tsx
Problem: Realtime events come in without agent name — the join data is missing
Fix: After receiving a realtime event, look up agent from the agents prop by event.agent_id
If no match → show "Agent" not "System"

### Bug 3 — Agent filter chips show only 6 of 24 agents
File: components/tasks/TasksBoard.tsx
Problem: Filter chips are hardcoded or limited to 6 agents
Fix: Show ALL agents that have assigned tasks. If more than 8, show a "+N more" overflow or a dropdown

### Bug 4 — service.ts duplicates admin.ts
File: lib/supabase/service.ts
Problem: createServiceClient() is identical to createAdminClient() in lib/supabase/admin.ts
Fix: Delete lib/supabase/service.ts. Update ALL imports of createServiceClient to use createAdminClient from lib/supabase/admin.ts instead.

### Bug 5 — New task form empty project warning
File: components/tasks/NewTaskForm.tsx
Problem: Project dropdown is empty with no explanation
Fix: If projects array is empty, show: "No projects found. Create a project first." with a link to /projects/new

## Design Fixes (assign to Sara — all UI):

Sara must read these files COMPLETELY before touching any UI:
- C:\Users\Fares\Downloads\PMS\docs\design-system.json
- C:\Users\Fares\Downloads\PMS\docs\design_concept.json
- C:\Users\Fares\Downloads\PMS\components\tasks\MyTasksPage.tsx (gold standard)
- C:\Users\Fares\Downloads\PMS\components\projects-content.tsx (gold standard)
- C:\Users\Fares\Downloads\PMS\app\(dashboard)\projects\page.tsx (gold standard page)

### Design Fix 1 — All Mission Control pages must match Projects/Clients exactly
Check every page in app/(dashboard)/:
- /agents, /agents/communication, /approvals, /gateways, /boards, /board-groups, /skills/marketplace, /tags, /activity, /custom-fields, /tasks

For each page verify:
- Page wrapper: `flex flex-1 flex-col bg-background mx-2 my-2 border border-border rounded-lg min-w-0`
- Header uses PageHeader component with SidebarTrigger on left, title, action buttons on right
- NO hardcoded colors — CSS variables only (bg-background, text-foreground, border-border, etc.)
- Cards use shadcn Card component
- Icons are Phosphor Icons (from @phosphor-icons/react/dist/ssr/)
- Forms use React Hook Form + Zod

### Design Fix 2 — AgentDetailPanel consistency
File: components/agents/AgentDetailPanel.tsx
Check it matches TaskDetailPanel style:
- Same Sheet width and padding
- Same header style (border-b, p-6)
- Same form spacing (space-y-4)
- Same footer (border-t, p-4, flex justify-end)
- Loading skeleton matches TaskDetailPanel loading state

### Design Fix 3 — Tasks page tab styling
File: app/(dashboard)/tasks/page.tsx
Verify the Tabs component (My Tasks / Mission Control) uses the correct underline style matching the existing project tabs in project details pages. Check components/projects/ProjectDetailsPage.tsx for the tab pattern and match it exactly.

## Process:
1. You (Omar) spawn Mostafa for ALL bug fixes
2. Mostafa fixes all 5 bugs, writes report to docs/reports/mostafa-bug-fixes.md, spawns you back
3. You review Mostafa's fixes
4. You spawn Sara for ALL design fixes
5. Sara fixes all design issues, writes report to docs/reports/sara-design-fixes.md, spawns you back
6. You review Sara's design fixes
7. You spawn Hady for full QA pass
8. Hady writes report to docs/reports/hady-qa-final.md, spawns you back
9. If Hady PASS: commit everything, push, write sign-off to docs/reports/omar-final-signoff.md, spawn Product Analyst
10. If Hady FAIL: fix issues, re-run Hady until PASS

## Rules:
- Run pnpm.cmd build after EVERY fix — 0 TypeScript errors required
- NO new features — only fixes
- Commit message format: "fix: [description]" or "style: [description]"

## Spawning Product Analyst back:
When your full cycle is complete and Hady has passed, spawn the Product Analyst back with:
- label: product-analyst-bugfix
- requester: agent:main:main
- task: "Omar's full pipeline is complete. Hady QA passed. All bugs fixed and design consistent. Sign-off: docs/reports/omar-final-signoff.md. Please write consolidated report and notify Ziko."
