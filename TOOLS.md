# TOOLS.md - Local Notes

## Supabase (Agent Logging)
- URL: https://uvqnrysmjpyupkhtnyfd.supabase.co
- Anon Key: stored in `scripts/log-agent-task.ps1`
- Table: `agent_logs` (agent_name, task_description, model_used, status, created_at)
- Log script: `C:\Users\Fares\.openclaw\workspace\scripts\log-agent-task.ps1`
- Hard gate: every agent logs BEFORE final reply
- CLI: `npx supabase` (no global install; use npx)
- Migrations: use `npx supabase db push` for future DB changes (not browser SQL editor)

## Supermemory
- API: https://api.supermemory.ai/v3
- Container tag: `ziko-memory`
- Add memory: POST /v3/documents { content, containerTag, customId?, metadata? }
- Search: POST /v3/search { q, containerTags }
- Key stored in: env var SUPERMEMORY_API_KEY (see .openclaw/.env)

## OpenClaw Webhook Endpoint (Native)
- Endpoint: http://localhost:18789/hooks
- Token: [stored in openclaw.json hooks.token — ask Ziko]
- POST /hooks/wake — wake main session with a system event
- POST /hooks/agent — run isolated agent turn, deliver to channel
- Use for: external triggers → Ziko

## TTS
- Preferred voice: (not set yet)

## Cameras
- (none configured)

## SSH
- (none configured)
