# Tasks — Auto‑Assign Pipeline + Manual Override + DISPATCH‑FOOTER Fix

## Product Analyst → Dev Handoff
- [ ] Review spec/plan for alignment with router + supervisor files.

## Dev Tasks
1. Data model
   - [ ] Add/confirm `todos.intent`, `intent_confidence`, `override_by`, `override_reason`, `override_at`.
   - [ ] Ensure `status` includes `needs_review`.

2. Routing + pipeline actions
   - [ ] Build `autoAssignTodo` server action.
   - [ ] Build `advancePipeline` server action with stage validation.

3. Dispatch builder + footer fix
   - [ ] Centralize footer template read from `agents/DISPATCH-FOOTER.md`.
   - [ ] Add server‑side placeholder injection and validation (block on failure).
   - [ ] Ensure dispatch always includes real TodoId.

4. Manual override UI
   - [ ] Add routing panel with override dropdown + stage controls.
   - [ ] Persist override metadata.

5. Guardrails + validation
   - [ ] Add Zod schemas for actions.
   - [ ] Prevent duplicate dispatches.

6. Tests
   - [ ] Unit tests for routing and footer validation.
   - [ ] Integration test for pipeline transitions.

7. Docs
   - [ ] Update internal docs for auto‑assign pipeline + footer rules.

## Testing Tasks
- [ ] Verify auto‑assignment works for common intents.
- [ ] Verify ambiguous intent goes to `needs_review`.
- [ ] Verify manual override works and logs metadata.
- [ ] Verify dispatch blocked on missing/invalid DISPATCH‑FOOTER.

## Review Tasks
- [ ] Confirm pipeline automation follows PA → DEV → TEST → REVIEW.
- [ ] Confirm TodoId is always present in dispatch footer.
