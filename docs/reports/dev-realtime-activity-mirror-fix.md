# Dev Report — Realtime Activity Mirror Fix (v1)

## What was built

Implemented an infrastructure-level activity mirroring daemon so PMS activity is pushed automatically without relying on prompt reminders.

### New files
- `scripts/activity-mirror-daemon.js`
- `scripts/start-activity-mirror.ps1`
- `scripts/openclaw-daemons.bat`
- `scripts/install-daemons-autostart.ps1`

## How it works

`activity-mirror-daemon.js` tails OpenClaw gateway logs (`openclaw logs --json --follow`) and translates runtime events into PMS events via existing `scripts/push-event.ps1`.

### Event mapping (v1)
- `embedded run start` → `task_started`
- `embedded run tool start` (first + every 5 tools) → `task_progress`
- `embedded run done (aborted=false)` → `task_completed`
- `embedded run done (aborted=true)` or `agent end isError=true` → `task_failed`
- `embedded run prompt end` (+ telegram send fallback) → `agent_message`

### Agent coverage
- Uses session key parsing + sessionId lookup from all local agent stores under:
  - `C:\Users\Fares\.openclaw\agents\*\sessions\sessions.json`
- This allows coverage for main + subagents (including dev/marketing/designer/reviewer/product-analyst/main where session keys exist).
- UUID mapping included for the 6 core Mission Control agents + backward-compatible aliases.

### Deduplication
- Persisted state file: `C:\Users\Fares\.openclaw\workspace\.pi\activity-mirror-state.json`
- Keeps recent seen keys (`MAX_SEEN=5000`) and run mapping caches to prevent spam/replay duplicates after restart.

### Reliability & health
- Retries PMS push up to 3 times with backoff.
- Serial push queue avoids burst/concurrency issues.
- Health/error logs:
  - `scripts/activity-mirror.log`
  - `scripts/activity-mirror-err.log`
- Auto-restarts log-tail subprocess if it exits unexpectedly.

## Autostart integration

Added workspace launcher:
- `scripts/openclaw-daemons.bat` now starts:
  - notification daemon
  - sync daemon
  - activity mirror daemon

Added installer:
- `scripts/install-daemons-autostart.ps1`
- Copies launcher to Startup folder as `openclaw-daemons.bat`.

## Validation steps

1. One-shot replay parse test (safe):
   ```powershell
   node C:\Users\Fares\.openclaw\workspace\scripts\activity-mirror-daemon.js --once --limit=200 --dry-run
   ```
2. Live daemon run:
   ```powershell
   node C:\Users\Fares\.openclaw\workspace\scripts\activity-mirror-daemon.js
   ```
3. Trigger activity from main and a subagent.
4. Confirm PMS `agent_events` receives:
   - task_started
   - task_progress
   - task_completed / task_failed
   - agent_message
5. Confirm logs are healthy (no repeated push failures).

## Sample log lines

From `activity-mirror.log` (expected format):
- `[boot] activity mirror daemon starting dryRun=false`
- `[push-ok] task_started dev 89fdee5e-...`
- `[push-ok] task_progress dev 89fdee5e-...`
- `[push-ok] task_completed dev 89fdee5e-...`
- `[push-ok] agent_message dev 89fdee5e-...`

From `activity-mirror-err.log` (if transient errors):
- `[push-fail] attempt=1 type=task_progress run=... err=exit=1 ...`

## Limits / known caveats

- Depends on OpenClaw log message formats. If upstream log wording changes, regex mapping may need updates.
- If a session key has no UUID mapping, event is skipped with a clear log line.
- `task_progress` is sampled (first tool + every 5th tool) to reduce spam by design.
- `agent_message` currently uses prompt-cycle completion and telegram-send fallback, not full natural-language response body.

## Manual compatibility

No changes to `scripts/push-event.ps1`; manual push behavior remains intact.
