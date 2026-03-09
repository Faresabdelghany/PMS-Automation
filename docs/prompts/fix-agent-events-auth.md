# Fix: /api/agent-events Authentication Issue

## What We're Building
PMS (pms-nine-gold.vercel.app) is a project management SaaS being evolved into an AI Mission Control — a live command center where an AI agent called Ziko (running on the user's local machine via OpenClaw) can push real-time events into PMS so the user can see what their AI agents are doing.

The two-way bridge works like this:
- **OpenClaw → PMS**: Ziko calls `POST /api/agent-events` with a Bearer token to push events (task started, task completed, agent messages, etc.)
- **PMS → OpenClaw**: PMS writes to `agent_commands` Supabase table, OpenClaw polls it

## The Problem
`POST /api/agent-events` is returning `401 Unauthorized` even when sending the correct Supabase service role key.

### Root Cause
The route validates the Bearer token like this:
```typescript
const token = authHeader?.replace("Bearer ", "").trim()
if (!token || token !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

This means the token we send must **exactly** match `process.env.SUPABASE_SERVICE_ROLE_KEY` on Vercel. The problem is this creates a fragile single-key auth that:
1. Requires the Vercel env var to be manually kept in sync with the Supabase project
2. Breaks if there's ever a trailing space, line break, or copy-paste issue in Vercel's dashboard
3. Can't be tested locally without the exact production key

## What We Want
Replace the brittle env-var string comparison with **actual Supabase JWT verification** — verify the Bearer token is a valid Supabase service role JWT for our project.

A valid Supabase service role JWT has these claims when decoded:
- `role: "service_role"`
- `iss: "supabase"`
- `ref: "<our-project-ref>"` (our project ref is `lazhmdyajdqbnxxwyxun`)

Instead of comparing raw strings, decode the JWT and verify these claims. This way it works as long as the token is a genuine Supabase service role key for this project — no need to store it as a separate env var at all.

## Project Context
- **Repo**: `C:\Users\Fares\Downloads\PMS` (also at https://github.com/Faresabdelghany/PMS)
- **File to fix**: `app/api/agent-events/route.ts`
- **Supabase project ref**: `lazhmdyajdqbnxxwyxun`
- **Supabase URL**: `https://lazhmdyajdqbnxxwyxun.supabase.co`
- **Current .env.local service role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhemhtZHlhamRxYm54eHd5eHVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTAzMzUzMCwiZXhwIjoyMDg0NjA5NTMwfQ.ynuJxkd-n6t162KfbHsaR-OVPBG-Ap65T_-VfCqN4ao`
- **Middleware**: `middleware.ts` — already has `/api/agent-events` in PUBLIC_ROUTES so it bypasses session auth ✅
- **Tech stack**: Next.js 16, TypeScript strict, no external JWT libraries installed (use Node.js built-ins or atob)

## The Fix

Replace the auth check in `app/api/agent-events/route.ts` with JWT claim verification:

```typescript
function verifySupabaseServiceToken(authHeader: string | null): boolean {
  if (!authHeader?.startsWith("Bearer ")) return false
  const token = authHeader.replace("Bearer ", "").trim()
  
  try {
    // Decode JWT payload (base64url decode the middle part)
    const parts = token.split(".")
    if (parts.length !== 3) return false
    
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    )
    
    // Verify it's a Supabase service_role token for our project
    return (
      payload.role === "service_role" &&
      payload.iss === "supabase" &&
      payload.ref === "lazhmdyajdqbnxxwyxun"
    )
  } catch {
    return false
  }
}
```

Then replace the auth check:
```typescript
// OLD:
const token = authHeader?.replace("Bearer ", "").trim()
if (!token || token !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

// NEW:
if (!verifySupabaseServiceToken(authHeader)) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

## Requirements
1. Fix the auth in `app/api/agent-events/route.ts` using the JWT approach above
2. Run `pnpm.cmd build` — must pass with 0 TypeScript errors
3. Commit with message: `fix: verify supabase JWT claims instead of env var string comparison`
4. Push to main

## Also Check
While you're in this file, also check:
- The `agent_events` table insert uses `organization_id` column — make sure this matches the actual Supabase schema (the column might be `org_id` in some migrations)
- If there's a type error on the `event_type` cast, fix it

## Do NOT Change
- The rest of the route logic (task status updates, event insertion)
- The middleware.ts PUBLIC_ROUTES (already correct)
- Any other files unless needed for the TypeScript build to pass
