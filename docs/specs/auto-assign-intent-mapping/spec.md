# Spec — Auto-assign intent mapping + pipeline automation

## Summary
Introduce intent-based auto-assignment with explicit override rules and pipeline stage automation. Tasks are auto-assigned to the correct role based on intent mappings, and reassigned as they progress through the PA → Dev → Testing → Review pipeline. Manual assignment is preserved unless a rule explicitly allows override.

## Problem
Tasks are frequently misrouted or left unassigned. Manual assignment sometimes conflicts with automated routing, creating ambiguity and stalled work. We need deterministic assignment rules that respect manual ownership unless an explicit override is required.

## Goals
- Auto-assign tasks based on intent mapping at creation and when intent/stage changes.
- Enforce the pipeline order (PA → Dev → Testing → Review) with predictable re-assignment at stage boundaries.
- Preserve manual assignments unless an explicit override condition is met.
- Provide auditability for assignment changes.

## Non-goals
- Building ML intent classification (assume intent is already provided).
- New role/permission systems beyond existing org roles.
- Full workflow builder UI (use minimal rule config for now).

## Users
- **Ops/PMs**: expect tasks routed to the right role without manual chasing.
- **Agents/Team members**: receive tasks when they are responsible for the current stage.

## Definitions
- **Intent**: A categorical label on a task (e.g., `product-analyst`, `dev`, `testing`, `review`).
- **Intent mapping rule**: Configuration that maps intent → role + default stage + override policy.
- **Pipeline stages**: `PA`, `Dev`, `Testing`, `Review` (fixed order).

## Requirements
### R1 — Intent resolution
- On task creation, if intent is present, resolve to an intent mapping rule.
- On intent update, re-resolve and apply assignment rules.

### R2 — Assignment logic (with explicit overrides)
- If task has **no assignee**, auto-assign to rule’s role/assignee.
- If task has a **manual assignee**, keep it **unless** an explicit override condition is met (see R3).
- Every auto-assignment records the reason and previous assignee (if any).

### R3 — Explicit override conditions
Manual assignments are overridden only when **one** of these conditions is true:
1. **Pipeline step transition**: when stage advances to the next pipeline stage, the system auto-assigns the owner for that stage.
2. **Rule override flag**: the resolved intent mapping rule has `override_manual = true`.
3. **Task override flag**: task has `force_auto_assign = true` (set by Ops).

### R4 — Pipeline automation
- When task stage advances to the next step, auto-assign to the role mapped for that stage.
- Stages must follow the fixed order (PA → Dev → Testing → Review). Skipping is blocked unless `allow_skip = true` on the task (admin-only).
- Stage change should update `status` and `assignee` consistently.

### R5 — Auditability
- Maintain an assignment audit log entry for every auto-assign or override with:
  - timestamp
  - previous assignee
  - new assignee
  - rule/condition that triggered it
  - actor (system or user)

### R6 — UI feedback
- Task sidebar shows:
  - Current intent + mapped role
  - “Auto-assigned by <rule>” or “Manual assignment preserved”
  - Override reason when applicable

## Success Metrics
- ≥90% of tasks are assigned within 1 minute of creation or stage change.
- <5% of assignments require manual correction.
- Pipeline stage transitions result in correct assignee ≥98% of the time.

## Analytics Events
- `task_auto_assigned` (intent, stage, rule_id, override_reason)
- `task_assignment_overridden` (manual_to_auto, reason)
- `task_stage_changed` (from_stage, to_stage, auto_assigned)

## Edge Cases
- Intent not found → fallback to “Unassigned” and flag for Ops.
- Manual assignee belongs to the same role as mapping → keep manual, no override.
- Task with `allow_skip=true` can jump stages but still triggers auto-assign for the target stage.

## Acceptance Criteria
- Creating a task with intent auto-assigns according to mapping.
- Updating intent triggers re-evaluation; manual assignee remains unless override condition met.
- Stage transition auto-assigns to the stage owner role.
- Assignment audit log entries exist for each auto-assign.
- UI surfaces the assignment reason.
