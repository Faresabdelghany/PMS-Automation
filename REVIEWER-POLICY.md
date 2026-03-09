# Code Reviewer Policy — When to Approve vs Request Changes

## Reviewer entry conditions
- All child tasks must be in state `tested_passed` or `done`
- Reviewer receives final implementation package from PA

## Reviewer transitions

### Route 1: `tested_passed → in_review` (standard path)
**When to use this:**
- Any child task reaches `tested_passed` after Tester sign-off
- Reviewer performs quality/safety/architecture review on that task
- Reviewer may want to inspect code, check patterns, verify error handling
- Task proceeds through Reviewer gate before final completion

**Command:**
```powershell
transition-child-task.ps1 -TaskId <id> -ToStatus in_review -Actor Reviewer
```

### Route 2: `tested_passed → done` (fast-track, no Reviewer gate)
**When to use this:**
- Task is low-risk, low-complexity, or already-validated code pattern
- Reviewer explicitly approves skipping detailed review
- PA confirms task meets spec completely
- Applies mainly to:
  - Style/formatting/documentation-only tasks
  - Config/dependency updates with clear acceptance criteria
  - Small targeted bug fixes validated by automated tests
  - Refactors with 100% test coverage maintained

**Command:**
```powershell
transition-child-task.ps1 -TaskId <id> -ToStatus done -Actor Reviewer
```

## Reviewer approval decision logic

```
IF task is tested_passed:
  IF low_risk_category:
    approve tested_passed → done (fast-track)
  ELSE:
    route tested_passed → in_review (standard review gate)
  
  IF in_review:
    IF passes_review_criteria:
      approve in_review → done
    ELSE:
      request in_review → changes_requested
      (task returns to Dev for fixes)
```

## Risk tiers

**Low-risk (fast-track eligible):**
- Pure documentation
- Comments/docstring improvements
- Formatting/linting (no logic change)
- Dependency updates with automated tests passing
- Logging/instrumentation with no behavior change

**Standard-risk (requires in_review):**
- Feature implementation
- Database migrations
- API changes
- Error handling changes
- Configuration logic
- Permission/auth changes
- Any production behavior change

**High-risk (mandatory deep review):**
- Security-sensitive code
- Payment/billing logic
- Data deletion/mutation logic
- Critical path changes
- Breaking changes
- Concurrency/race-condition-prone code

## Reviewer approval criteria (standard review)

For `in_review → done`, reviewer must verify:
1. ✅ Spec compliance (matches PA requirements)
2. ✅ Code quality (readable, maintainable, no obvious bugs)
3. ✅ Safety (edge cases handled, errors logged, rollback-safe)
4. ✅ Completeness (acceptance criteria fully met)
5. ✅ Maintainability (follows project patterns, no unnecessary complexity)

## Rejection criteria (request changes)

Reviewer marks `in_review → changes_requested` when:
- Code does not match spec
- Logic error detected
- Missing error handling
- Security issue found
- Test coverage insufficient
- Pattern violation
- Performance concern

Task returns to Dev with findings; PA re-validates before next review cycle.

## Final approval

When reviewer approves:
```powershell
transition-child-task.ps1 -TaskId <id> -ToStatus done -Actor Reviewer -Summary "Approved: meets spec, quality, safety"
```

This completes the task and (if final child) triggers PA consolidation → Ziko → User.
