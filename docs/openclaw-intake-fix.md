# OpenClaw Intake Fix — Plan (Option C)

> Created: 2026-03-10 | Status: Ready to implement

## What We're Fixing

Telegram messages sent to `@Fares_Agents_bot` are **not reaching the PMS database**.
Zero tasks with `source: 'telegram'` exist in Supabase — the intake pipeline has never worked.

## Root Causes (Confirmed via DB audit)

1. **DB constraint blocks `'telegram'`** — `todos_source_check` only allows `('manual','speckit','system','agent')`. Every intake insert is rejected silently.
2. **Schema drift** — Scripts reference `task_events.actor` but the actual column is `actor_name`. Silent write failures throughout the event pipeline.
3. **Agent runs stuck at `queued`** — Execution watcher on Windows isn't picking up dispatched runs.

## Chosen Solution: Option C — PMS API Intake Endpoint

Instead of OpenClaw writing directly to Supabase (fragile, schema-sensitive),
build a proper POST endpoint in PMS that OpenClaw calls. One place to validate,
log, and insert — no more silent drops.

## What Gets Built

### PMS-Automation side (Next.js)
- `app/api/intake/route.ts` — POST endpoint
  - Authenticates via `Authorization: Bearer <INTAKE_API_SECRET>` header
  - Validates payload with Zod
  - Writes to Supabase using service role key (server-side, bypasses RLS safely)
  - Returns structured error on failure (no more silent drops)
- New migration: add `'telegram'` to `todos_source_check` constraint
- New env vars: `SUPABASE_SERVICE_ROLE_KEY` + `INTAKE_API_SECRET`

### OpenClaw side (Windows — `intake-request.ps1`)
- Change from direct Supabase REST write → single `Invoke-RestMethod` POST to:
  `https://<pms-vercel-url>/api/intake`
- Pass `Authorization: Bearer <INTAKE_API_SECRET>` header
- Log the HTTP response so failures are visible in `daemon.log`

## What's Needed to Start

1. **Supabase service role key**
   → Supabase dashboard → Settings → API → `service_role` (the secret key, not anon)

2. **API secret string**
   → Anything you want, e.g. `sk_openclaw_2026` — stored in `.env.local` + Vercel env vars

## Implementation Checklist

- [ ] Get service role key + API secret from Fares
- [ ] Build `app/api/intake/route.ts`
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` + `INTAKE_API_SECRET` to `.env.local`
- [ ] Add same vars to Vercel dashboard
- [ ] Write migration: add `'telegram'` to source constraint
- [ ] Update `intake-request.ps1` on Windows to POST to endpoint
- [ ] Test: Telegram message → API → Supabase `todos` row → PMS UI

## Key DB Facts

| Item | Value |
|------|-------|
| Supabase project | `uvqnrysmjpyupkhtnyfD.supabase.co` |
| Anon key location | `PMS-Automation/.env.local` |
| todos source constraint | `('manual','speckit','system','agent')` |
| task_events columns | `id, todo_id, run_id, event_type, actor_type, actor_name, summary, metadata, created_at` |
| OpenClaw scripts path | `C:\Users\Fares\.openclaw\workspace\scripts\` |
| Telegram bot | `@Fares_Agents_bot` (polling mode) |
