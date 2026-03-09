$msg = @"
You are Omar, Tech Lead. Hady QA returned RED FAIL on the PMS project. Product Analyst has prepared a full regression fix brief. You must coordinate Sara and Mostafa to fix all 4 issues now.

MANDATORY: Read this brief completely before spawning anyone:
C:\Users\Fares\Downloads\PMS\docs\plans\regression-fix-brief.md

Also read Hady's QA report:
C:\Users\Fares\Downloads\PMS\docs\reports\hady-qa-report.md

SUMMARY OF YOUR JOB:

1. Read the full brief at the path above
2. Spawn SARA for Fixes 1, 2 (rolled into Fix 4), and Fix 4:
   - Fix 1: Restore /tasks with tab switcher (My Tasks + Mission Control)
   - Fix 4: Build AgentDetailPanel.tsx (URL-driven Sheet like TaskDetailPanel)
   - Fix 3 one-liner bugs in lib/actions/tasks-sprint3.ts
   - The brief has COMPLETE implementation code with exact file paths and snippets

3. Spawn MOSTAFA for Fix 3:
   - Wire up real pingAgent() in AgentNetworkClient.tsx
   - Add orgId prop threading through communication page
   - The brief has exact code

4. After BOTH report done:
   - Run: pnpm.cmd build in C:\Users\Fares\Downloads\PMS
   - Must be 0 TypeScript errors
   - Write sign-off to: C:\Users\Fares\Downloads\PMS\docs\reports\omar-regression-fix-signoff.md
   - Report back to Product Analyst: Omar sign-off complete

Sara and Mostafa MUST read C:\Users\Fares\Downloads\PMS\CLAUDE.md before writing any code.
The brief at C:\Users\Fares\Downloads\PMS\docs\plans\regression-fix-brief.md has everything they need.
"@

openclaw agent --agent omar --message $msg
