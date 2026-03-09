# Required Operating Contract — PA → Dev ↔ Tester ↔ Reviewer

## Canonical chain
User → Ziko → Product Analyst (PA) → PMS child task creation → Dev ↔ Tester ↔ PA loop (task by task) → Reviewer → PA → Ziko → User

## Non-negotiable enforcement points
1. PMS is source of execution truth.
2. PA must persist SpecKit decomposition as real child tasks via one approved ingestion script.
3. Dev starts only after PA gate passes.
4. Exactly one active child task (`ready` or `in_progress`) per parent.
5. Tester validates each task before next task unlock.
6. PA is requirement authority and only PA unlocks next task after tested pass.

## Approved SpecKit ingestion path (single path)
- Script: `scripts/ingest-speckit-decomposition.ps1`
- Input: parent todo id + decomposition JSON
- Output: ordered child tasks (`source=speckit`) assigned to Dev
- Behavior:
  - first child = `ready`
  - remaining children = `queued`
  - idempotent by `(parent_task_id, order_index, source='speckit')`

## PA gate (before Dev)
- Script: `scripts/verify-pa-spec-gate.ps1`
- Required:
  - `spec.md` exists
  - `plan.md` exists
  - `tasks.md` exists
  - speckit child rows exist in PMS
  - exactly one task active (`ready`/`in_progress`)
  - all others queued
  - all assigned to Dev
- Failure emits `spec_incomplete` event/log and blocks Dev.

## Child task status lifecycle
`queued → ready → in_progress → dev_done → in_test → tested_passed → done`

Alternate transitions:
- `in_test → changes_requested → in_progress`
- `tested_passed → in_review → done`
- terminal: `failed | cancelled`

## Transition enforcer
- Script: `scripts/transition-child-task.ps1`
- Role-based transitions are enforced.
- Unlock behavior: only when PA marks current task `done`, next queued task becomes `ready`.

## Runtime observability requirement (all stages)
Each stage must write:
- `agent_runs`
- `task_events`
- `agent_logs`
linked by `todo_id` and `run_id`.

Wrapper path remains mandatory:
- `dispatch-subagent-run.ps1`
- `attach-subagent-session.ps1`
- `finalize-subagent-run.ps1`
with guard/recovery scripts as backup.
