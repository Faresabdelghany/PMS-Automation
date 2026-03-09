# Plan — Auto-assign intent mapping + pipeline automation

## Architecture Overview
- **Rules source:** `intent_mapping_rules` table (or config) containing intent → role + default stage + override flag.
- **Assignment engine:** server action invoked on task create/update and stage transition.
- **Audit log:** `task_assignment_audit` table capturing changes.

## Data Model Changes
1. **intent_mapping_rules**
   - `id`, `organization_id`, `intent_key`, `role_id`, `default_stage`, `override_manual` (bool)
2. **tasks**
   - `intent` (existing), `stage` (existing), add `force_auto_assign` (bool), `allow_skip` (bool)
3. **task_assignment_audit**
   - `id`, `task_id`, `previous_assignee_id`, `new_assignee_id`, `reason`, `actor_type`, `created_at`

## Server Actions (lib/actions)
- `resolveIntentRule(taskId)` → returns rule and metadata.
- `applyAutoAssignment(taskId, context)` → applies logic and writes audit.
- `advanceStage(taskId, toStage)` → validates stage order, triggers auto-assign.

## UI/UX
- Task detail sidebar panel:
  - Intent badge
  - Mapped role
  - Assignment reason (auto vs manual)
  - Override reason
- Admin settings page (minimal) to manage intent rules (CRUD).

## Logic Flow
1. **On task creation:**
   - If intent exists → resolve rule.
   - If no assignee → assign based on rule.
   - If manual assignee → keep unless override flag true.
2. **On intent update:**
   - Re-resolve rule → apply override rules if necessary.
3. **On stage advance:**
   - Validate pipeline order or allow_skip.
   - Auto-assign to stage owner role.

## Validation & Error Handling
- Zod schemas for intent rules, stage transitions, overrides.
- Return `{ data?, error? }` from actions.

## Rollout
- Behind feature flag `auto_assign_intent` per org.
- Enable for internal org first.

## Test Plan
- Unit tests for rule resolution & override logic.
- Integration tests for stage transition auto-assign.
- UI tests for assignment reason display.
