# Analysis — Auto‑Assign Pipeline + Manual Override + DISPATCH‑FOOTER Fix

## Key Decisions
- Use rule‑based intent routing (router map) instead of ML.
- Enforce server‑side DISPATCH‑FOOTER injection + validation to prevent edit errors.
- Manual override always wins over auto‑assignment.

## Risks
- Misclassification of intent → wrong agent. Mitigation: `needs_review` status for low confidence.
- Duplicate dispatches if re‑run quickly. Mitigation: idempotency guard by todo status.
- Footer validation false positives if template changes. Mitigation: central template + tests.

## Open Questions
- What is the exact list of intents and agent mappings in `agents/ROUTER.md`?
- Are there existing automation hooks on todo creation we should reuse?

## Scope Check
- Estimated 1–2 days of work. Within limit.

## DISPATCH‑FOOTER Edit Error (Proposed Fix)
Likely cause: footer text was manually edited or altered in dispatch composition, removing required placeholders (TodoId/log command). Fix by:
- Making footer read‑only and injected server‑side.
- Validating required tokens at dispatch time.
- Blocking dispatch with a clear error when invalid.
