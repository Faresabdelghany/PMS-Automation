# Report — Auto‑Assign Pipeline + DISPATCH‑FOOTER Fix

## What I delivered
- Spec, plan, tasks, and analysis for auto‑assign pipeline with manual override.
- Identified DISPATCH‑FOOTER edit error risk and proposed server‑side template injection + validation.

## Files
- `docs/specs/auto-assign-pipeline/spec.md`
- `docs/specs/auto-assign-pipeline/plan.md`
- `docs/specs/auto-assign-pipeline/tasks.md`
- `docs/specs/auto-assign-pipeline/analysis.md`

## Fix Proposal (DISPATCH‑FOOTER)
- Treat footer as read‑only template from `agents/DISPATCH-FOOTER.md`.
- Inject placeholders server‑side (AgentName/Model/TodoId).
- Validate required tokens (`log-agent-task.ps1`, `-TodoId`, `-AgentName`, `-TaskDescription`, `-ModelUsed`).
- Block dispatch and surface error if invalid.
