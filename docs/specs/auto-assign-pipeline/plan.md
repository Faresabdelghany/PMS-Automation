# Plan — Auto‑Assign Pipeline + Manual Override + DISPATCH‑FOOTER Fix

## Architecture Overview
- **Routing layer:** server action reads new todo, classifies intent with rule‑based router map.
- **Pipeline engine:** server action drives PA → DEV → TEST → REVIEW transitions, updating todo fields.
- **Dispatch builder:** server‑side composition that appends DISPATCH‑FOOTER template and validates placeholders.
- **Manual override UI:** todo detail panel with override + stage controls.

## Implementation Plan
1. **Data model additions (Supabase)**
   - Add `intent`, `intent_confidence`, `override_by`, `override_reason`, `override_at` columns to `todos` if missing.
   - Ensure `workflow_stage` and `status` enums include `needs_review`.

2. **Routing logic (Server Action)**
   - Implement `lib/actions/autoAssignTodo.ts`:
     - On todo creation, map `intent` using router rules (string match / keyword map).
     - Write `assignee`, `workflow_stage=PA`, `status=queued`.
     - If ambiguous, set `status=needs_review`.

3. **Pipeline engine**
   - Implement `lib/actions/advancePipeline.ts`:
     - Validate current stage status.
     - Update todo fields for next stage.
     - Call dispatch builder with correct agent + TodoId.

4. **Dispatch builder + DISPATCH‑FOOTER fix**
   - Centralize footer template read from `agents/DISPATCH-FOOTER.md`.
   - Inject placeholders server‑side and validate required tokens.
   - If validation fails, return error and block dispatch.

5. **Manual override UI**
   - Add UI in todo detail (server component + client sub‑component for controls).
   - Actions: override agent, advance stage, retry stage, skip stage.
   - Log override fields (by/when/why).

6. **Validation + guardrails**
   - Zod schemas for server actions.
   - Ensure organization scoping.
   - Prevent duplicate dispatch if already in progress.

7. **Testing**
   - Unit tests for routing rules and footer validation.
   - Integration tests for pipeline transitions.

## Rollout
- Feature flag `auto_assign_pipeline` default off.
- Enable for internal orgs first.

## Notes
- Use Next.js 15 server actions and Supabase client from `lib/supabase/server.ts`.
- Revalidate todo detail routes after mutations.
