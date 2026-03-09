# Auto-Dispatch + 10-Min Status Sweep — Design (2026-03-06)

## Goals
- Auto-assign by intent and **auto-dispatch immediately** (including Ziko).
- Run a **strict 10-minute cron** to check task status and progress.
- Use **Task Comments** as the handoff trail (agent mentions & updates).
- **No auto-close** by system.

## Approach (Chosen)
**Realtime + Cron (Recommended)**
- Realtime listener auto-assigns then auto-dispatches immediately.
- Cron job performs a periodic status sweep, reporting current assignee + latest activity.

## Realtime Auto-Dispatch
- On INSERT/UPDATE of `todos`:
  - Run intent classifier.
  - Update `assignee`, `workflow_stage`, `category` if needed.
  - If dispatchable (status=todo, valid assignee, unclaimed):
    - Run `task-watcher.ps1` to claim and set in_progress.
    - Wake Ziko (hook) for orchestration.

## 10-Min Status Sweep
- Cron every 10 minutes.
- Fetch open tasks (`todo` + `in_progress`).
- For each task:
  - Pull latest comment (`comments` table) and latest agent log (`agent_logs`).
  - Compute most recent activity time.
  - Output concise line: status, assignee, workflow_stage, last activity + short note.
- Post report to Fares (Telegram DM).

## Comments-based Handoff
- Agents must post progress/finish in Task Comments with @mentions.
- Next agent responds in comments and tags the next responsible agent.

## Non-Goals
- No auto-close or forced status changes.
- No skipping the pipeline (PA → DEV → TEST → REVIEW).

## Risks
- Extra traffic from per-task comment/log lookups.
- Requires Telegram DM delivery token.

## Mitigations
- Limit report to open tasks only.
- Keep report compact.
