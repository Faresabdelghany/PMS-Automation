# Analysis — Auto-assign intent mapping + pipeline automation

## Risks
- **Rule conflicts:** Multiple intents mapped to different roles may create ambiguity.
- **Manual override confusion:** Users might be surprised by overrides unless reasons are visible.
- **Pipeline enforcement:** Strict ordering could block urgent tasks without allow-skip.

## Assumptions
- Task intent is already available and reliable.
- Roles are already defined per org.
- Stage field exists and is used in workflow.

## Open Questions
- Do we need multi-intent support (primary + secondary)?
- Should assignment be to a **role** or a **default user** per role?
- Do we need notification on auto-assign events?

## Dependencies
- Supabase schema updates
- Existing task stage/status model
- Feature flag framework (if available)

## Test Scenarios
1. Create task with intent + no assignee → auto-assign.
2. Create task with intent + manual assignee → preserved.
3. Update intent with `override_manual=true` → override manual.
4. Stage advance from PA → Dev → reassign to Dev role.
5. Stage skip without `allow_skip` → blocked.
6. Audit log entry for every auto-assign.

## Escalation Check
- Business context for override rules: **Provided via explicit override conditions in spec.**
- Scope >2 days: **Likely 1–2 days**, mainly schema + logic + UI.
