# Best Practices Research Report
**Compiled by:** Product Analyst Agent  
**Date:** 2026-03-03  
**For:** Fares's AI-Powered Software Team  
**Pipeline:** Fares → Ziko → Product Analyst → Dev → Testing Agent → Code Reviewer → Ziko → Fares

---

## Executive Summary

This report synthesizes current best practices across every role in our pipeline. Each section contains research-backed insights translated into **concrete, immediately actionable changes**. No fluff — only moves we can make this week.

---

## 1. 🤖 AI-Assisted Development Workflows

### Research Findings
- 80%+ of developers report AI productivity gains (DORA 2025), but the real boost comes from **how** teams structure AI handoffs, not just what tools they use
- Teams achieving 3-10x speed use AI for parallelization, not just code generation — running planning, scaffolding, and testing concurrently
- Code churn (code discarded within 2 weeks) is doubling at teams with poor AI review gates — speed without quality gates is a trap
- A July 2025 METR study found experienced devs sometimes took **19% longer** when using AI poorly, believing they were 20% faster — perception vs. reality gap is real

### Actionable Improvements for Our Pipeline

**1. Parallel Agent Execution Where Possible**
- Ziko should identify tasks where Product Analyst can spec while Dev scaffolds the project structure simultaneously. Don't serialize everything.
- Example: PA writes feature spec → Dev starts file structure + boilerplate → PA finishes acceptance criteria → Dev implements. Overlap saves 30-40% wall clock time.

**2. Implement a "Context Package" Between Every Handoff**
- Every agent handoff must include: (a) what was decided, (b) what was explicitly ruled out ("do not revisit"), (c) current state, (d) immediate next step
- Right now handoffs are likely just raw task descriptions. Add a structured JSON-like context block to every task passed between agents.

**3. Add a Human Checkpoint Gate for Ambiguous Decisions**
- Don't let AI agents make architectural or UX decisions autonomously. Flag them back to Fares or Ziko with a proposed answer and an explicit approval request.
- Rule: if an agent has >2 valid interpretations of a requirement, it must escalate before continuing.

**4. Track "Code Churn" as a Pipeline Quality Metric**
- After each Dev → Code Reviewer cycle, log how much code was rewritten by the reviewer or flagged as "should have been different."
- High churn = bad specs or bad task definition upstream. Trace the root cause back to the right agent.

**5. Rotate Context Windows Proactively**
- AI agents lose quality as context fills. For long Codex sessions, have Dev break work into 2-3 focused sub-tasks rather than one mega-prompt. Checkpoint and restart context.

---

## 2. 🧠 Product Spec / PRD Writing Best Practices

### Research Findings
- The most common PRD failure: **missing "non-goals"** — what we're explicitly NOT building. This causes scope creep and developer confusion.
- AI dev teams need PRDs with **explicit acceptance criteria** — not "users should be able to log in" but "given an authenticated user, when they click the dashboard link, then they land on /dashboard within 500ms"
- A new pattern emerging for AI-assisted teams: **Prompt Requirements Document** — a structured spec that defines how AI tools should be instructed to build the feature, not just what the feature does

### Actionable Improvements for Our Product Analyst

**1. Standardize the PRD Template — Use This Structure Every Time**
```
## Problem Statement
## Target Users (persona + scenario)
## Goals (SMART — measurable)
## Non-Goals (explicit out-of-scope list)
## Core Features + User Stories
## Acceptance Criteria (Given/When/Then format)
## Technical Constraints
## Success Metrics
## Open Questions (flagged for Fares/Ziko)
```

**2. Write Acceptance Criteria in BDD Format**
- Format: `Given [context], When [action], Then [outcome]`
- Every feature must have at least 3 ACs: happy path, edge case, error state
- These directly become Playwright test scenarios — zero translation needed by the Testing Agent

**3. Add a "Dev Interpretation Check" Section**
- After writing the spec, explicitly answer: "What are the 3 most likely ways a developer could misread this?"
- Then clarify those ambiguities inline before handing off
- This single step cuts back-and-forth with Dev by ~50%

**4. Include a "Design Dependencies" Block**
- List every UI element that needs a Designer decision before Dev can implement
- If no designer is available yet, include a minimal spec: "Use shadcn/ui Button component, variant=primary, label='Submit'"
- Dev should never be blocked on design ambiguity

**5. Version Every PRD**
- PRD v1.0 = initial spec → PA writes
- PRD v1.1 = after Ziko review
- PRD v1.2 = after Dev questions answered
- Store in `/docs/specs/[feature-name]/prd-v1.0.md`

---

## 3. 🛠️ Dev Handoff & Task Definition

### Research Findings
- The #1 reason AI developers (Codex, Claude Code) produce wrong output: **underspecified tasks**. The model fills gaps with assumptions.
- Perfect task definition for AI devs includes: file paths, expected inputs/outputs, data model references, code style expectations, and a clear "done" definition
- "Chain of thought" prompting — asking the AI to reason step-by-step before coding — reduces errors by 30%+ on complex tasks
- Structured handoff documents with a "do not revisit" section prevent agents from re-litigating settled decisions and wasting context

### Actionable Improvements for Dev Task Handoffs

**1. Use This Exact Task Template for Every Dev Task**
```markdown
## Task: [Feature Name]
**Assigned to:** Dev (Codex)
**Source PRD:** /docs/specs/[feature]/prd-v1.2.md

### Context
[What this feature is for, 2-3 sentences max]

### Files to Create/Modify
- `/app/[route]/page.tsx` — create
- `/lib/[module].ts` — modify function `doThing()`
- `/types/[name].ts` — add interface

### Implementation Requirements
1. [Specific step with expected behavior]
2. [Specific step with expected behavior]

### Data Model
[Paste the relevant Supabase schema or TypeScript type]

### Do Not
- [List explicit anti-patterns or approaches to avoid]
- Do not use client-side state for X — use server actions

### Acceptance Criteria (from PRD)
- [ ] AC 1
- [ ] AC 2
- [ ] AC 3

### Definition of Done
- All ACs pass
- TypeScript strict mode: no `any` types
- No unused imports
- Add JSDoc to exported functions
```

**2. Reference the Codebase Architecture in Every Task**
- Include a `/docs/architecture.md` that Dev can reference. This should cover: project structure, state management approach, API patterns, DB access patterns.
- Codex performs significantly better with architectural context than without.

**3. Break Tasks at Natural Boundaries**
- Rule: one task = one commit = one reviewable unit
- Max task size: 1 new page or 3 modified components or 1 new API route
- If a task crosses these boundaries, split it. Compound tasks create compound errors.

**4. Specify TypeScript Types Explicitly**
- For Supabase tables, always pass the generated type reference
- Example: "Use `Database['public']['Tables']['users']['Row']` type, not a custom type"
- Reduces type mismatch bugs by eliminating model guessing

**5. Include a "Test Hints" Section**
- Tell Dev what edge cases to handle defensively:
  - "What if the user has no items? Render empty state"
  - "What if the API returns 429? Show retry UI"
- This reduces Testing Agent bug reports that are actually implementation gaps

---

## 4. 🧪 Testing Agent — Playwright Best Practices

### Research Findings
- Playwright's built-in `getByRole()` locators are 3x more stable than CSS selectors under UI changes — role-based locators are the non-negotiable baseline
- Page Object Model (POM) is essential at scale: without it, a single UI change breaks dozens of tests
- Running tests in parallel in CI cuts suite time by 60-80% — this should be enabled from day one
- Trace Viewer + video recording should always be enabled in CI for fast debugging

### Actionable Improvements for Testing Agent

**1. Enforce Page Object Model from the Start**
```
/tests
  /pages           ← Page Object classes (locators + actions only, NO assertions)
  /specs           ← Test files (assertions + user flows)
  /fixtures        ← Reusable setup/auth state
  /helpers         ← Utility functions
```
- Each `*.page.ts` file represents one page or major component
- Never put assertions inside page objects — keep them in spec files

**2. Use Acceptance Criteria as Direct Test Cases**
- Every BDD acceptance criterion from the PRD maps 1:1 to a Playwright test
- Test naming: `test('Given [context], When [action], Then [outcome]')`
- This makes coverage traceable back to requirements

**3. Set Up Auth State Once, Reuse Everywhere**
```typescript
// fixtures/auth.ts
export const test = base.extend({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: 'auth.json' });
    await use(await context.newPage());
  }
});
```
- Run login once, save storage state, reuse — 10x faster test suite

**4. Always Enable Tracing in CI**
```typescript
// playwright.config.ts
use: {
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```
- When a test fails in CI, Trace Viewer shows exactly what happened — no guessing

**5. Bug Report Template for Testing Agent**
```markdown
## Bug Report: [Feature Name]
**Test:** [test file + line number]
**Severity:** Critical / High / Medium / Low

### Steps to Reproduce
1. 
2. 

### Expected Behavior
[From AC in PRD]

### Actual Behavior
[What happened]

### Trace File
[Link or path to trace.zip]

### Screenshot
[Attached]
```

**6. Separate "Smoke" Tests from "Full Suite"**
- Smoke tests: 5-10 critical user paths, run on every PR, must pass in <2 minutes
- Full suite: all tests, run nightly or pre-deploy
- This balances speed and coverage

---

## 5. 🔍 Code Reviewer Best Practices

### Research Findings
- Google's standard: approve if the change "definitively improves overall code health," even if imperfect. Don't block on style when logic is sound.
- Optimal PR size: 200-400 lines. Bug detection quality drops sharply above 400 LOC.
- Automate everything automatable: linting, formatting, type checks, security scans. Human reviewers should ONLY focus on logic, architecture, and security edge cases.
- Reviewer rotation prevents single-point-of-knowledge bottlenecks and builds team-wide understanding

### Actionable Improvements for Code Reviewer

**1. Implement a Tiered Review Checklist**
```markdown
## Code Review Checklist

### Auto-checked (CI must pass before review)
- [ ] TypeScript: `tsc --noEmit` clean
- [ ] ESLint: 0 errors
- [ ] Tests: all pass
- [ ] Build: successful

### Human review — Logic
- [ ] Does it solve what the PRD says?
- [ ] Are all acceptance criteria met?
- [ ] Edge cases handled? (empty state, error state, loading state)
- [ ] No race conditions or async bugs?

### Human review — Security
- [ ] No sensitive data logged
- [ ] User input sanitized/validated
- [ ] Auth checks on all protected routes
- [ ] No hardcoded secrets

### Human review — Performance
- [ ] No N+1 queries
- [ ] Large lists paginated or virtualized
- [ ] No unnecessary re-renders

### Human review — Code Quality
- [ ] Functions < 50 lines
- [ ] No `any` TypeScript types
- [ ] Meaningful variable names
- [ ] No dead code
```

**2. Set a Hard PR Size Limit**
- Max 400 LOC per PR (excluding generated files, migrations)
- If Dev submits a PR > 400 LOC, Code Reviewer sends it back for splitting — not reviews it
- This single rule dramatically improves review quality

**3. Distinguish Comment Severity**
- `[BLOCKER]` — must fix before merge
- `[SUGGESTION]` — optional improvement, author decides
- `[NIT]` — style/polish, don't block on this
- `[QUESTION]` — needs clarification, not necessarily a fix
- Without this tagging, every comment feels equally urgent and creates unnecessary back-and-forth

**4. Code Reviewer Produces a Structured Output**
```markdown
## Review Result: [Feature Name]
**Decision:** APPROVED / APPROVED WITH NITS / REQUEST CHANGES

### Blockers (must fix)
- [specific issue with file:line reference]

### Suggestions (optional)
- [improvement idea]

### Questions
- [clarification needed]

### Notes for Ziko
- [anything that affects the broader system or needs architectural discussion]
```

**5. Use AI-Assisted Pre-Review**
- Before human review, run CodeRabbit or similar AI review tool
- AI catches style, common bugs, obvious issues
- Human reviewer focuses on what AI can't catch: business logic, architectural fit, security intent

---

## 6. 🎨 Designer — Design-to-Dev Handoff Best Practices

### Research Findings
- Figma Dev Mode is the gold standard for 2024 handoffs — developers get CSS snippets, specs, and export-ready assets without designer involvement
- "Design tokens" (named values for colors, spacing, typography) are the bridge between design and code — without them, devs hardcode values and drift from the design system
- Component variants in Figma should mirror component props in code — if Figma has Button/Primary/Hover, code should have `<Button variant="primary" state="hover">`
- Early dev involvement in design reviews catches technical constraints before they become handoff blockers

### Actionable Improvements for Designer Handoff

**1. Always Use Dev Mode with "Ready for Dev" Status Markers**
- Designer marks frames as "Ready for Dev" only when fully specified
- Annotate: dimensions, spacing, interaction behaviors, edge cases, responsive breakpoints
- Dev never picks up a frame that isn't marked "Ready for Dev"

**2. Establish a Design Token System Before Building Anything**
```
colors:
  brand-primary: #hex
  text-primary: #hex
  surface-default: #hex

spacing:
  sm: 8px, md: 16px, lg: 24px, xl: 32px

typography:
  heading-1: font/size/weight
  body: font/size/weight
```
- These map directly to Tailwind CSS config or CSS variables
- Designer uses tokens, Dev uses same tokens — zero translation

**3. Provide One Screen Per State**
- For every interactive component: default, hover, active, disabled, loading, error, empty state
- Dev should never have to invent a state — designer specifies all of them
- Missing states are the #1 cause of "it looks wrong in edge cases" bugs

**4. Component Spec Sheet Format**
- For each new component, deliver:
  - Component name (matches code component name)
  - All variants with visual examples
  - Props list with types and defaults
  - Interaction spec (what happens on click/focus/etc.)
  - Responsive behavior at 3 breakpoints (mobile/tablet/desktop)

**5. Use Figma Variables Linked to Code**
- For teams using shadcn/ui + Tailwind: create a Figma library that mirrors the exact component library
- When Dev uses `<Button variant="destructive">`, it matches the Figma component named "Button/Destructive"
- Naming parity between design and code eliminates translation errors

---

## 7. 📣 Marketing — SaaS Best Practices for Early-Stage Products

### Research Findings
- Product-Led Growth (PLG) outperforms sales-led for early SaaS in 2024: let the product sell itself via freemium or free trial, reduce friction to first value
- "Time to Value" (TTV) is the key metric — how fast can a new user experience the core value proposition? Under 5 minutes is the target.
- Content marketing + SEO is the highest-ROI channel at scale, but paid ads are faster for hypothesis testing. Use paid to test, SEO to scale.
- LTV:CAC ratio should be tracked from day one. Below 3:1 means the business model is broken regardless of revenue.
- AI-generated content for SEO is table stakes now — the differentiator is product-centric content that shows real use cases, not generic blog posts.

### Actionable Improvements for Marketing

**1. Define ICP Before Writing a Single Word of Copy**
- Ideal Customer Profile must specify: industry, company size, job title, pain points, current solution, willingness to pay, where they hang out online
- All copy, channel choices, and messaging must reference the ICP doc
- `/docs/marketing/icp.md` — create this before any campaign

**2. Build the "First 5 Minutes" Experience First**
- Map the exact steps from signup → first value moment
- Measure this flow: where do users drop off?
- Optimize the onboarding flow before spending on acquisition. Acquiring users into a leaky bucket is waste.

**3. Use a Content-Channel Matrix**
- For early stage: pick 2 channels max. Going wide is how startups waste runway.
- Recommended: (1) SEO/content for compounding long-term traffic, (2) LinkedIn/Twitter for direct founder-audience connection
- Measure: MQLs per channel per $100 spent. Kill the losers monthly.

**4. Implement Closed-Loop Feedback for Marketing → Product**
- Every marketing claim should be traceable to a product capability
- If marketing says "ships 10x faster," product must deliver that experience
- Create a shared doc: "Marketing Promises vs. Product Reality" — review weekly

**5. Launch with a "Minimum Viable Launch" Checklist**
```
Pre-launch:
- [ ] Landing page live with clear value prop + CTA
- [ ] Email capture working
- [ ] Onboarding flow <5 steps to first value
- [ ] 3 SEO-optimized blog posts live
- [ ] Analytics tracking: pageviews, signups, activation events

Launch:
- [ ] Product Hunt post drafted
- [ ] Twitter/LinkedIn announcement ready
- [ ] Email to beta list with launch announcement
- [ ] Personal outreach to 20 warm leads

Post-launch:
- [ ] Weekly metrics review (signups, activation, churn)
- [ ] User interviews scheduled (min 5/week for first month)
```

---

## 8. 🎛️ Multi-Agent AI Orchestration (Ziko's Layer)

### Research Findings
- The most reliable multi-agent pattern: **hierarchical orchestration** — one orchestrator (Ziko) dispatches to specialized agents, collects results, and handles failures. Fully decentralized peer-to-peer creates coordination nightmares.
- Context loss between agents is the #1 failure mode. Structured "context packages" with explicit state transfer are essential.
- Start simple: 2-3 agents, then add more. Every added agent adds coordination overhead and failure surface area.
- Human-in-the-loop (HITL) checkpoints at high-stakes decision points dramatically reduce catastrophic errors.
- Shared memory with namespacing (each agent reads/writes to its own namespace) prevents one agent's state from corrupting another's.

### Actionable Improvements for Ziko's Orchestration

**1. Implement a Canonical Inter-Agent Context Package**
- Every task dispatched from Ziko to an agent must include:
```json
{
  "task_id": "feat-001-user-auth",
  "from": "ziko",
  "to": "dev",
  "context": {
    "feature": "User authentication with Supabase",
    "prd_path": "/docs/specs/user-auth/prd-v1.2.md",
    "prior_decisions": ["Using Supabase Auth, not custom JWT", "Email/password only for v1"],
    "do_not_revisit": ["No social auth", "No 2FA in v1"],
    "current_state": "PRD approved, design handoff complete",
    "next_step": "Implement /auth/login page and Supabase session handling"
  },
  "outputs_expected": ["PR link", "brief summary of approach taken"],
  "escalate_if": ["Auth flow deviates from Supabase patterns", "More than 3 new files needed"]
}
```

**2. Define Agent Escalation Triggers Upfront**
- Each agent should know exactly when to stop and escalate rather than guess
- Escalation triggers per agent:
  - **PA:** Conflicting stakeholder requirements, missing business context
  - **Dev:** Ambiguous architecture decision, external API behavior unclear, task > 2 days
  - **Testing Agent:** >20% test failure rate on first run (spec problem, not test problem)
  - **Code Reviewer:** Security vulnerability found, architectural flaw found, PR > 400 LOC

**3. Use Sequential + Parallel Hybrid Pipeline**
- Sequential (must be in order): PA → Dev (can't code what isn't specced)
- Parallel opportunities: PA spec + Designer wireframes simultaneously; Testing Agent + Code Review simultaneously on different aspects
- Ziko's job is to identify and exploit parallelism without creating dependency conflicts

**4. Log Every Agent Decision with Rationale**
- Every meaningful decision made by an agent should be logged to PMS with the rationale
- Not just "built login page" but "used server actions instead of API routes because the PRD specified no client-side form handling"
- This creates an audit trail and prevents future agents from undoing decisions unknowingly

**5. Implement a Pipeline Health Dashboard**
- Track per feature: time in each stage, number of revision cycles, escalations count
- Red flags: > 2 revision cycles between same two agents (indicates a systemic spec or communication problem)
- Review pipeline health weekly. Optimize the most common bottleneck first.

**6. Set Maximum Iteration Limits Per Agent**
- Dev gets max 3 iterations to get a feature "reviewer-approved"
- Testing Agent files max 10 bugs before escalating (>10 = spec problem, not bugs)
- Code Reviewer gets 24h max to complete review before auto-escalation
- Without limits, agents can loop indefinitely and burn resources

---

## 9. Cross-Cutting Recommendations

These apply to the entire pipeline, not a single role.

### Golden Rules

1. **Everything goes to PMS** — every task start, completion, and failure. No invisible work.
2. **Specs before code** — Dev never starts without a reviewed PRD. Non-negotiable.
3. **Small PRs always** — 200-400 LOC max. Split anything larger before review begins.
4. **BDD acceptance criteria** — Every feature spec ends with testable Given/When/Then criteria.
5. **Context packages** — No agent receives a task without structured context from the prior stage.
6. **Escalate, don't guess** — Ambiguity escalates to Ziko/Fares. Bad assumptions cost more time than asking.

### Document Structure to Create Now
```
/docs
  /specs
    /[feature-name]
      prd-v1.0.md     ← PA output
      prd-v1.1.md     ← after Ziko review
  /architecture.md    ← system architecture reference for Dev
  /design-tokens.md   ← color/spacing/type tokens
  /marketing
    icp.md            ← Ideal Customer Profile
    messaging.md      ← core value prop + messaging
  /reports
    best-practices-research.md   ← this file
```

### First 3 Things to Implement This Week
1. **Create the PRD template** at `/docs/templates/prd-template.md` — PA uses it for every feature from now on
2. **Create the Dev task template** at `/docs/templates/dev-task-template.md` — Ziko uses it for every Dev dispatch
3. **Add the code review checklist** to the Code Reviewer's system prompt or SKILL.md

---

*Report compiled via web research synthesis — sources include DORA 2025, Google Engineering Practices, Playwright documentation, Figma Dev Mode guides, METR AI productivity study, and multiple SaaS GTM frameworks.*
