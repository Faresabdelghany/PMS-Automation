# Tasks — Auto-assign intent mapping + pipeline automation

## Product/Spec
- [x] Spec completed
- [x] Plan completed

## Engineering
1. **DB/Schema**
   - Add `intent_mapping_rules` table
   - Add `force_auto_assign` + `allow_skip` to `tasks`
   - Add `task_assignment_audit` table
2. **Server Actions**
   - Implement `resolveIntentRule`
   - Implement `applyAutoAssignment`
   - Implement `advanceStage`
3. **Business Logic**
   - Auto-assign on create and intent update
   - Auto-assign on stage advance
   - Enforce override rules (manual preserved unless explicit)
4. **UI**
   - Task sidebar: intent + mapped role + assignment reason
   - Admin settings CRUD for intent rules
5. **Analytics**
   - Emit `task_auto_assigned`, `task_assignment_overridden`, `task_stage_changed`
6. **QA**
   - Test intent not found
   - Test manual assignment preserved
   - Test override conditions
   - Test stage transition ordering

## QA / Verification Checklist
- [ ] Auto-assign on create with intent
- [ ] Manual assignee preserved unless override
- [ ] Stage advance triggers auto-assign to new role
- [ ] Audit log entries exist
- [ ] UI shows reason + override details
