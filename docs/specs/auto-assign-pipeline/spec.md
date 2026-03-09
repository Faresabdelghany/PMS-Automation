# Spec — Auto-Assign Pipeline + Manual Override + DISPATCH-FOOTER Fix

## Summary
Build an automated task pipeline that routes incoming intents to the correct agent and executes the full PA → DEV → TEST → REVIEW sequence automatically, with a manual override. Fix the DISPATCH-FOOTER edit error by enforcing a validated, read-only footer template during dispatch construction.

## Problem
- Routing is manual and error‑prone; tasks can stall or be assigned to the wrong agent.
- Pipeline stages (PA → DEV → TEST → REVIEW) are not consistently automated.
- DISPATCH-FOOTER content can be edited incorrectly, causing missing TodoId or logging commands.

## Goals
1. Auto‑assign tasks to the correct agent based on intent.
2. Auto‑advance through PA → DEV → TEST → REVIEW with proper todo status updates.
3. Provide a manual override for routing and stage selection.
4. Prevent DISPATCH-FOOTER corruption or missing required placeholders.

## Non‑Goals
- Building new ML models for intent detection (use rule‑based/router map first).
- Changing existing logging script behavior.
- Rewriting the agent orchestration framework.

## Users
- Orchestrator (Ziko) managing dispatch pipeline.
- Agents executing tasks (PA, Dev, Testing, Reviewer).

## User Stories
- As Ziko, I want tasks auto‑assigned so dispatch is fast and consistent.
- As Ziko, I want to override auto‑assignment when needed.
- As the system, I want to block dispatch if DISPATCH-FOOTER is malformed or missing TodoId.

## Functional Requirements
### 1) Intent Routing
- On new todo creation, classify intent using existing router rules (agents/ROUTER.md) and map to agent.
- If intent is ambiguous, mark todo as `needs_review` and require manual assignment.
- Route types should include: Product Analyst, Dev, Testing Agent, Code Reviewer, Designer, Marketing Agent, Job Search Agent.

### 2) Full Pipeline Automation
- Pipeline stages: PA → DEV → TEST → REVIEW.
- Each stage update must set: `todos.status`, `todos.assignee`, `todos.workflow_stage`.
- Upon stage completion, next stage is dispatched automatically.
- Dev/Testing/Review dispatch must include DISPATCH-FOOTER appended verbatim with correct TodoId.

### 3) Manual Override
- UI control to override:
  - Assigned agent
  - Pipeline stage (advance/skip/re‑run)
- Overrides should be audited (store who/when/why).
- Manual override must still enforce DISPATCH-FOOTER on dispatch.

### 4) DISPATCH‑FOOTER Fix
**Observed error:** DISPATCH‑FOOTER content is editable and can be inadvertently modified, leading to missing TodoId or altered logging command.
**Fix requirements:**
- Footer template stored in a read‑only server template (source of truth).
- Dispatch builder must inject template server‑side and validate required tokens:
  - `log-agent-task.ps1`
  - `-TodoId "<id>"`
  - `-AgentName`, `-TaskDescription`, `-ModelUsed`
- If validation fails, block dispatch with a clear error.

## UX Requirements
- Add a “Routing” panel on todo detail:
  - Auto‑assigned agent (label + confidence).
  - Manual override dropdown.
  - Stage controls (Advance / Retry / Skip).
- Show validation error if DISPATCH‑FOOTER missing/invalid before dispatch.

## Data / Fields
- `todos.intent` (string)
- `todos.intent_confidence` (number 0–1)
- `todos.assignee` (string)
- `todos.workflow_stage` (enum: PA | DEV | TEST | REVIEW)
- `todos.status` (enum: queued | in_progress | done | blocked | needs_review)
- `todos.override_by`, `todos.override_reason`, `todos.override_at`

## Acceptance Criteria
- New todos are auto‑classified and assigned within 5 seconds.
- Pipeline auto‑advances with correct status updates on completion.
- Manual override works and is logged.
- Dispatch blocked if footer missing or invalid.
- No dispatch is sent without a valid TodoId in the footer.

## Success Metrics
- ≥90% of new tasks auto‑assigned without manual override.
- 0% dispatches missing valid DISPATCH-FOOTER.
- Average time from intake → PA dispatch < 1 minute.

## Edge Cases
- Missing or invalid TodoId: dispatch is blocked with error.
- Ambiguous intent: route to `needs_review` queue.
- Manual override conflicts with auto‑advance (manual choice wins).
- Re‑dispatching a completed stage should prompt confirmation.

## Dependencies
- Router mapping and supervisor pipeline configuration.
- Access to DISPATCH‑FOOTER template.
