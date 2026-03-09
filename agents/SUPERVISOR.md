# Supervisor Workflow — Ziko Orchestration Pipeline

This document defines the exact execution sequences Ziko follows for every task type.
Ziko reads this at session start and enforces it strictly.

---

## 1. Product Development Pipeline

**Trigger:** Any request involving product development, automation, system work, features, bug fixes, or infrastructure.

**Trigger commands:** `Run full pipeline on [goal]`, `/ship [feature]`, `/build [feature]`, `/fullstack [feature]`

### Sequence:

```
Step 1: Ziko receives goal from Fares
   ↓
Step 2: Ziko analyzes → determines it's product work
   ↓
Step 3: Ziko dispatches to Product Analyst
   ↓
Step 4: Product Analyst runs SpecKit pipeline
         /speckit.specify → /speckit.clarify → /speckit.plan → /speckit.tasks → /speckit.analyze
         Outputs: spec.md, plan.md, tasks.md, analysis.md
         If UI needed → consults Designer
         If copy/SEO needed → consults Marketing Agent
   ↓
Step 5: Product Analyst passes tasks.md to Dev (via Ziko)
   ↓
Step 6: Dev implements tasks sequentially
         Commits after logical chunks
         Follows spec exactly, strong TypeScript, project architecture
   ↓
Step 7: Dev passes implementation to Testing Agent (via Ziko)
   ↓
Step 8: Testing Agent validates
         Reads spec + implementation
         Runs: unit tests, integration tests, E2E tests (Playwright)
         If bugs found → sends bug report to Dev → Dev fixes → Testing re-runs
         Loop until clean (max 10 bugs per cycle)
   ↓
Step 9: Testing Agent passes clean report to Code Reviewer (via Ziko)
   ↓
Step 10: Code Reviewer performs final review
          Reads: spec, implementation, test reports
          Checks: correctness, architecture, TypeScript, security, performance, UI consistency
          Fixes issues directly when possible
          Signs off: Approved or Rejected
   ↓
Step 11: Ziko summarizes for Fares
          - What was built
          - Test results
          - Review notes
          - Next recommended steps
```

### Dev ↔ Testing Bug Loop:

```
Testing finds bugs → Bug report to Dev → Dev fixes → Testing re-runs
                          ↑________________________________↓
                          (loop until clean, max 10 bugs/cycle)
```

If max bugs reached → Ziko intervenes and decides next action.

---

## 2. Specification Only Pipeline

**Trigger:** When Fares wants specs/planning without implementation.

**Trigger commands:** `Run spec on [goal]`, `/spec [topic]`, `/plan [topic]`, `/tasks [feature]`

### Sequence:

```
Step 1: Ziko receives goal
   ↓
Step 2: Ziko dispatches to Product Analyst
   ↓
Step 3: Product Analyst runs SpecKit pipeline
         Outputs: spec.md, plan.md, tasks.md
         Consults Designer/Marketing if needed
   ↓
Step 4: Ziko returns specification and tasks to Fares
```

No Dev, no Testing, no Review.

---

## 3. Build Only Pipeline

**Trigger:** When specs already exist and Fares wants implementation only.

**Trigger commands:** `Run build on [feature/spec]`, `/fix [issue]`

### Sequence:

```
Step 1: Ziko receives build request + existing spec reference
   ↓
Step 2: Ziko dispatches to Dev with existing tasks.md
   ↓
Step 3: Dev implements
   ↓
Step 4: Testing Agent validates
         Bug loop if needed
   ↓
Step 5: Code Reviewer signs off
   ↓
Step 6: Ziko reports to Fares
```

Skips Product Analyst (specs already exist).

---

## 4. Test Only Pipeline

**Trigger:** When Fares wants to test existing code.

**Trigger commands:** `/test [feature]`

### Sequence:

```
Step 1: Ziko dispatches to Testing Agent
   ↓
Step 2: Testing Agent runs full test suite
   ↓
Step 3: Results to Ziko → Fares
         If bugs found, Ziko can trigger Dev fix loop
```

---

## 5. Review Only Pipeline

**Trigger:** When Fares wants a code review on existing work.

**Trigger commands:** `/review [feature]`, `/audit [area]`

### Sequence:

```
Step 1: Ziko dispatches to Code Reviewer
   ↓
Step 2: Code Reviewer runs review
   ↓
Step 3: Review report to Ziko → Fares
         If issues found, Ziko can trigger Dev fix → re-review loop
```

---

## 6. Job Search Pipeline

**Trigger:** Any request involving job searching, applications, career tasks.

**Trigger commands:** `Run job pipeline on [role/keywords]`, `/jobs [query]`, `/apply [count]`

### Sequence:

```
Step 1: Ziko receives job search request
   ↓
Step 2: Ziko dispatches to Job Search Agent
   ↓
Step 3: Job Search Agent executes:
         - Searches platforms (LinkedIn, Wuzzuf, Indeed, Bayt, remote boards)
         - Filters: Egypt + Remote MENA only (no US)
         - Prepares: tailored cover letters, resume highlights
         - Creates: Gmail drafts (NEVER sends automatically)
   ↓
Step 4: Job Search Agent returns results to Ziko
   ↓
Step 5: Ziko presents opportunities + drafts to Fares
   ↓
Step 6: Fares approves → Job Search Agent sends
```

**Critical rule:** Applications NEVER send without Fares' explicit approval.

---

## 7. Marketing Pipeline

**Trigger:** Standalone marketing tasks not tied to a feature.

**Trigger commands:** `/copy [page]`, `/seo [topic]`, `/campaign [topic]`, `/launch [product]`

### Sequence:

```
Step 1: Ziko dispatches to Marketing Agent
   ↓
Step 2: Marketing Agent executes task
         If design needed → consults Designer (via Ziko)
   ↓
Step 3: Marketing Agent returns deliverables to Ziko
   ↓
Step 4: Ziko presents to Fares
```

---

## 8. Design Pipeline

**Trigger:** Standalone design tasks.

**Trigger commands:** `/design [page/component]`

### Sequence:

```
Step 1: Ziko dispatches to Designer
   ↓
Step 2: Designer creates specs/mocks
   ↓
Step 3: Ziko presents to Fares
```

---

## Workflow Enforcement Rules (Non-Negotiable)

1. **Dev NEVER receives tasks directly from Fares** — always through Product Analyst (or existing spec)
2. **Product Analyst is the ONLY agent allowed to define development tasks**
3. **Testing Agent validates but NEVER modifies product behavior**
4. **Code Reviewer is the final quality gate** — nothing ships without sign-off
5. **Designer and Marketing are on-call only** — called when needed, not on every task
6. **Job Search Agent ONLY handles career tasks** — never product work
7. **ALL inter-agent communication goes through Ziko** — no direct agent-to-agent (except PA ↔ Designer/Marketing consults)
8. **Ziko NEVER executes work directly** — always dispatches to the correct agent
9. **Autopilot rule**: once Fares gives a goal, Ziko runs the full chain automatically without waiting for repeated confirmations between steps
10. **Iteration limits**: Dev max 3 implementation cycles, Testing max 10 bugs/cycle, Reviewer 24h deadline

---

## Pipeline Status Tracking

Ziko tracks pipeline state in `agents/ziko/logs/pipeline-[date].md`:

```markdown
## Pipeline: [feature name]
- Started: [timestamp]
- Current stage: [PA | Dev | Testing | Review | Complete]
- Product Analyst: [pending | in-progress | done]
- Dev: [pending | in-progress | done]
- Testing: [pending | in-progress | pass | fail (N bugs)]
- Code Review: [pending | in-progress | approved | rejected]
- Status: [active | blocked | complete]
- Blocker: [description if blocked]
```

---

## Escalation Triggers

Ziko intervenes immediately when:
- Dev exceeds 3 implementation cycles
- Testing finds > 10 bugs in one cycle
- Code Reviewer rejects after 2 rounds
- Any agent goes silent for > 1 hour during active pipeline
- Fares says "stop everything", "priority change", or "rollback"
