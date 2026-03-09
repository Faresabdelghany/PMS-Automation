# HEARTBEAT.md

## 0. Output format guardrails
- Prefix every outbound message with the agent name + emoji (e.g., `Ziko ⚡:`), per the Message Prefix Rule.

## 1. Auto-assign + Task Watcher (PRIORITY — run every heartbeat)
- Run: `powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\auto-assign.ps1"`
- Then run: `powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\task-watcher.ps1"`
- If output contains `TASKS_FOUND`, parse the claimed tasks and dispatch each through the agent pipeline.
- If output is `NO_NEW_TASKS`, skip.
- This is the heartbeat fallback for the Supabase Realtime listener (`scripts/task-realtime.mjs`).
- Both systems run in parallel: realtime for instant pickup, heartbeat for resilience.

### Dispatch rules for claimed tasks:
- Read the task's `assignee` field to determine which agent to route to.
- If assignee is `Dev` → route through Product Analyst first (per pipeline rules).
- If assignee is `Ziko` → Ziko handles it directly or routes to the appropriate agent.
- If assignee is any other agent → dispatch directly to that agent.
- Always update the task status in Supabase as work progresses (in_progress → done).
- Always log to agent_logs with the `todo_id` linked.

## 2. Periodic checks
- Check for any pending tasks or agent updates
- Review recent memory files for context

## 3. Realtime listener health check
- If the realtime listener (`task-realtime.mjs`) is not running, restart it:
  `node "C:\Users\Fares\.openclaw\workspace\scripts\task-realtime.mjs"`
- Check via process list or try pinging.

If nothing needs attention, reply HEARTBEAT_OK.
