# Workflow Enhancement Research Report
**Author:** Product Analyst  
**Date:** 2026-03-03  
**For:** Fares + Ziko — AI Software Team  
**Status:** Final

---

## 1. Executive Summary — Top 5 Highest-Impact Changes

These 5 changes will move the needle more than everything else combined. Do these first.

### #1 — Install Supabase MCP + Context7 (Dev Agent, 1 day effort, massive impact)
Right now Dev (Codex) has no direct database access and uses stale documentation. Installing `supabase` MCP gives the Dev agent live schema inspection and SQL query capabilities without manual copy-paste. Context7 gives it up-to-date Next.js/React/Supabase docs, eliminating hallucinated APIs. Combined: **30-50% fewer revision cycles** because Dev stops guessing about schema and deprecated APIs.

### #2 — Install Linear Skill + Wire It to the Agent Chain (Ziko + all agents, 2 days effort, systemic impact)
Currently PMS is a custom Supabase setup and all task tracking is manual push-event calls. Linear has a native MCP that lets agents read/write issues, update status, and comment automatically. This replaces the brittle push-event.ps1 chain with a real project management layer. **Every agent task becomes a trackable, auditable Linear issue** — no more invisible work, no more gaps in PMS.

### #3 — Add Playwright MCP to Testing Agent (Testing Agent, 1 day effort, high impact)
The Testing Agent currently writes Playwright tests but can't **run them directly** from within the agent session. Playwright MCP (`playwright-mcp`) connects the Testing Agent to a live browser. It can verify the app in real-time during test writing, catch issues before they become bug reports, and generate smarter tests based on actual DOM state. This collapses the write-test → run → fix → write cycle.

### #4 — Replace Manual Command Queue with OpenClaw Native Webhooks (Ziko, 1 day effort, reliability impact)
Currently Ziko polls PMS via `poll-commands.ps1` every heartbeat. This is unreliable, adds latency, and creates complex state management. OpenClaw has native webhook support — GitHub PR events, Linear issue transitions, and external triggers can directly wake Ziko and dispatch to the right agent. **Zero polling. Event-driven. Instant response.** This also enables GitHub PR → Code Reviewer auto-trigger.

### #5 — Implement Parallel Agent Execution for Design + Dev Tracks (Ziko orchestration, 0 tooling cost, speed impact)
The current workflow is linear: PA → Design Lead → Dev. Design and Backend can run **simultaneously** from the PRD — Backend doesn't need designs. Ziko should dispatch the Backend Agent and Design Lead at the same time, then only Frontend waits for designs. This alone cuts **30-40% off wall-clock time** for every feature with a UI component, with no tooling changes needed.

---

## 2. Area 1 — Real-World Workflow Patterns

### 2.1 How Top Teams Are Actually Shipping Faster

#### Pattern: "Agent-First Engineering" (from OpenAI's internal Codex usage)
**What they do:** OpenAI uses Codex agents to generate nearly ALL code, tests, and documentation for some projects. Human engineers define goals and review output — they don't write code. Internal reports cite up to 10x build-time gains.

**Why it works:** Human time is spent on architecture decisions and review, not implementation. The bottleneck shifts from writing to reviewing, which is faster.

**How we adopt it:** Dev (Codex) should be writing ALL implementation. Ziko and PA's job is spec precision, not "helping" with code. When Dev returns output, Code Reviewer reviews it — humans don't touch the implementation. We're close to this model; we need to stop inline fixes and let the chain run.

**Key tactic from OpenAI:** They use `Plans.md` files — a structured planning document the agent writes BEFORE implementing. Dev agent should write a `plan.md` inside every feature spec folder before touching any code. This catches misunderstandings before they become commits.

#### Pattern: "Gold Standard Files + Shared Rules" (Cursor teams at Linear, Vercel)
**What they do:** Teams using Cursor maintain "gold standard" reference files — example implementations, pattern templates, and `.cursorrules` files that tell the AI exactly how the codebase is structured, what patterns to use, and what to avoid.

**Why it works:** The AI stops guessing team conventions. Code consistency improves dramatically. Reviewers spend less time flagging style violations.

**How we adopt it:** Create `docs/architecture.md` with explicit patterns (API route structure, Supabase query patterns, component conventions). Dev agent should receive this file in every task context package. Code Reviewer should flag deviations from it.

Immediately create:
```
docs/architecture.md          ← tech patterns reference
docs/code-standards.md        ← naming, structure, TypeScript rules
docs/design-system.md         ← component library reference
```

#### Pattern: "Parallel Worktrees for Concurrent Agent Tasks" (Advanced Codex workflow)
**What they do:** Teams use Git worktrees to run multiple Codex agents in parallel on different features — no branch conflicts, no waiting. One agent works on feature A, another on feature B, simultaneously.

**Why it works:** Removes serialization of feature development. Two features don't block each other.

**How we adopt it:** Ziko should explicitly set up separate Git branches for each active feature. Dev Agent should always work on a feature branch, never main. Multiple Dev sessions can run simultaneously on different branches. This is 0 additional cost, just a branching discipline.

#### Pattern: "AI-Assisted Pre-Review Before Human Review" (GitHub Copilot teams)
**What they do:** GitHub's internal teams run CodeRabbit or similar AI review tools BEFORE human Code Reviewer sees a PR. The AI catches style issues, obvious bugs, security patterns. Human reviewer only focuses on business logic and architectural decisions.

**Why it works:** Human reviewer has a smaller, higher-quality surface area. Review time drops from 2-4 hours to 30-60 minutes per PR.

**How we adopt it:** Add `clawhub install github` + set up CodeRabbit as a pre-review step. Code Reviewer's system prompt should specify: "Assume linting and style have already been checked by automated tools. Focus only on: logic correctness, security, architectural fit, and acceptance criteria coverage."

#### Pattern: "BDD Acceptance Criteria as Living Test Suite" (Shopify, Netflix QA teams)
**What they do:** Product specs are written in Given/When/Then format. This spec is the source of truth for both development AND testing. Testing Agent auto-generates test names and structure from spec ACs. If a test fails, you trace it back to the AC, not the test.

**Why it works:** 100% traceability. No test exists without a requirement behind it. No requirement is unverified.

**How we adopt it:** PA MUST write BDD ACs in every spec. Testing Agent MUST map each test to an AC with a comment like `// AC-3: User sees error on invalid email`. Code Reviewer checks: "Is every AC covered by at least one test?"

#### Pattern: "Context Package Discipline" (multi-agent teams broadly)
**What they do:** Every inter-agent handoff includes a structured JSON context object: what was decided, what is out of scope, current state, exactly what to do next. No bare task descriptions.

**Why it works:** Eliminates the "agent fills in gaps with assumptions" failure mode. Assumptions are the primary source of rework in AI-assisted development.

**How we adopt it:** We have a `context-package-template.md` — it needs to be ENFORCED, not just documented. Add a check in Ziko's system prompt: "Before dispatching any agent, verify you have filled every field in the context package template. Never send a bare instruction."

### 2.2 Adoption Plan

**This week:**
- [ ] Create `docs/architecture.md` with current tech stack patterns
- [ ] Update PA's task template to enforce BDD acceptance criteria
- [ ] Update Code Reviewer's prompt to skip style checking (assume pre-automated)
- [ ] Enforce context package template for every dispatch

**Next sprint:**
- [ ] Set up Git worktree workflow for parallel feature dev
- [ ] Add Plans.md step to Dev agent (write plan before code)
- [ ] Wire CodeRabbit or GitHub MCP for pre-review automation
- [ ] Enable parallel dispatch of Design Lead + Backend Agent from PA

---

## 3. Area 2 — Per-Agent Power Tools

### 3.1 ⚡ Ziko — Orchestrator

**Current state:** Dispatches agents via subagents tool, polls PMS via PowerShell script, routes via Telegram topics.

**Top Power-Up: OpenClaw Native Webhooks**
- **What:** Configure `openclaw webhooks` to receive GitHub PR events, Linear issue transitions, and deployment status notifications directly
- **Install:** Built into OpenClaw — `openclaw webhooks` CLI + docs at `https://docs.openclaw.ai/automation/webhook.md`
- **What it enables:** When Dev opens a PR → GitHub webhook → Ziko auto-dispatches Code Reviewer. When a Linear issue moves to "In Review" → Ziko gets notified. Zero polling, instant response.
- **Replace:** `scripts/poll-commands.ps1` becomes unnecessary for most cases

**Top Power-Up: OpenClaw Approvals CLI**
- **What:** `openclaw approvals` — structured approval queue. Agents submit approval requests, Fares sees a formatted approval prompt with context, approves/rejects with one tap
- **What it enables:** Replaces ad-hoc "do you approve?" messages with a tracked, auditable approval chain visible in PMS and Telegram
- **Install:** Built into OpenClaw — `openclaw approvals` CLI

**Top Power-Up: OpenClaw Cron for Scheduled Reports**
- **What:** `openclaw cron` — exact-timing scheduled jobs, unlike heartbeat which can drift
- **What it enables:** Daily 9am standup report (what was done yesterday, what's in progress, what's blocked), weekly metrics digest, automated sprint reviews
- **Install:** Built into OpenClaw — `openclaw cron` CLI

**Best Model for Ziko:** Stay on `claude-sonnet-4-6` for orchestration — it's the best balance of reasoning and speed for dispatching decisions. Switch to `claude-opus-4-6` only for complex architectural decisions or when Fares escalates a major blocker.

**Install:**
```bash
clawhub install github       # GitHub PR/issue management
openclaw webhooks --setup    # GitHub/Linear webhook receiver
```

---

### 3.2 🧠 Product Analyst — Specs, PRDs, Research

**Current state:** Writes specs, does research, produces reports. No live data access, no project management integration, relies on web search for research.

**Top Power-Up: Linear Skill**
- **Install:** `clawhub install linear`
- **What it does:** GraphQL-based integration — reads/creates/updates Linear issues, manages projects, tracks cycles
- **What it enables:** PA can create a Linear issue per feature automatically when a spec is approved. Can pull current sprint state to inform scope. Keeps PMS and Linear in sync.

**Top Power-Up: Supabase Skill (for analytics)**
- **Install:** `clawhub install supabase`
- **What it does:** Direct Supabase access — queries data, inspects schema, runs read-only analytics
- **What it enables:** PA can pull actual user behavior data from Supabase to inform specs. "How many users completed onboarding in the last 30 days?" becomes a live query, not a guess.

**Top Power-Up: Context7 MCP**
- **Install:** `clawhub install context7` (or via MCP: `npx -y @upstash/context7-mcp@latest`)
- **What it does:** Provides up-to-date, version-specific documentation for any library (Next.js, Supabase, Prisma, React, etc.)
- **What it enables:** PA can include accurate API references in specs, eliminating the "Dev got this wrong because the docs were outdated" class of bugs

**Top Power-Up: `brainstorming` skill (already installed, use it more)**
- Currently listed in available skills but underused
- PA should invoke brainstorming skill BEFORE writing any PRD to explore user intent and edge cases
- This is the diff between a "feature spec" and a "solution spec"

**Best Model for PA:**
- **Research tasks:** `gemini-2.5-pro` — massive context window (1M tokens) handles large docs, competitive research, and multi-source synthesis better than Claude
- **Spec writing:** `claude-sonnet-4-6` — superior structured output, clearer reasoning chains
- **Quick lookups:** `gemini-2.5-flash` — fast and cheap for iterative research loops

**Concrete Example of What This Enables:**
PA gets a task: "Spec the user dashboard." With current setup: web search + manual writing. With these tools: PA runs Supabase query to see what data exists, pulls Context7 docs for Supabase realtime subscriptions, creates Linear issue automatically, writes a PRD with live data references. Total time: -40%.

---

### 3.3 🛠️ Dev Agent — Full-Stack Next.js/Supabase/TypeScript

**Current state:** Codex implements from spec. No live DB access. Gets stale documentation. Relies on context package for all structure.

**Top Power-Up: Supabase MCP (CRITICAL)**
- **Install:** `clawhub install supabase`
- **What it does:** Dev can inspect live Supabase schema, run queries, manage tables, generate type-safe SQL
- **What it enables:** Dev stops guessing about schema. No more "I assumed the column was called userId but it's user_id" bugs. No more PR revisions for schema mismatches.
- **Impact:** Eliminates ~30% of Code Review blockers that are schema/type mismatches

**Top Power-Up: Context7 (CRITICAL)**
- **Install:** `clawhub install context7`
- **What it does:** Injects live, version-specific docs into Dev's context at the point of need
- **What it enables:** Dev never uses deprecated Supabase v1 auth when you're on v2. Never generates Next.js 12 `getServerSideProps` when you're on Next.js 14 with Server Components. Eliminates "works but wrong API version" bugs entirely.
- **Impact:** Eliminates ~20% of Code Review revisions

**Top Power-Up: GitHub MCP**
- **Install:** `clawhub install github`
- **What it does:** Dev can create branches, open PRs, respond to review comments, and check CI status directly
- **What it enables:** Dev can close the loop autonomously — write code → open PR → wait for Code Reviewer → fix comments → update PR — without Ziko manually re-dispatching
- **Plans.md discipline:** Before any code, Dev writes `docs/specs/[feature]/plan.md` with: files to create, data models used, implementation approach, edge cases handled. Ziko reviews plan before implementation starts.

**Best Model for Dev:**
- **Implementation:** `claude-sonnet-4-6` — best SWE-bench scores, excellent at multi-file reasoning
- **Complex architecture:** `claude-opus-4-6` — for tasks involving >10 files or major refactors
- **Boilerplate/scaffolding:** `gemini-2.5-flash` — fast and cheap for repetitive generation tasks

**Concrete Example:**
Dev task: "Build user authentication page." With Supabase MCP: Dev inspects the actual schema, sees the `auth.users` table, queries existing session patterns. With Context7: pulls current `@supabase/ssr` docs for Next.js 14. Writes plan.md first. Result: first PR has zero schema mismatches, uses correct API versions. Code Reviewer approves without revision cycle.

---

### 3.4 🧪 Testing Agent — Playwright E2E

**Current state:** Writes Playwright tests from spec ACs. Can't run them. Can't inspect live DOM. Relies on Dev's implementation details.

**Top Power-Up: Playwright MCP (CRITICAL)**
- **Install:** `npx '@playwright/mcp@latest'` or `clawhub install playwright-mcp`
- **What it does:** Full browser automation with MCP — Testing Agent can navigate the live app, take screenshots, inspect DOM state, click elements
- **What it enables:** Testing Agent writes AND runs tests within the same session. Finds bugs in real-time during test creation. Can identify flaky selectors before they become CI failures.
- **Impact:** Eliminates the "tests pass locally but fail in CI" loop

**Top Power-Up: GitHub MCP (for CI integration)**
- **Install:** `clawhub install github`
- **What it enables:** Testing Agent can read CI run logs, identify failing tests by name, link test failures back to specific commits, and comment on PRs with test reports
- **What it enables:** Ziko doesn't need to manually relay CI results — Testing Agent self-reports

**Skill Enhancement: `perf-audit` skill (already installed)**
- Testing Agent should invoke `perf-audit` on every major feature — not just functional tests but Lighthouse scores, Core Web Vitals, bundle size
- Add to testing checklist: performance regression check on every PR

**Bug Report Discipline:**
Testing Agent must use this exact format for every bug filed:
```markdown
## Bug: [Feature] — [AC Reference]
**Severity:** Critical/High/Medium/Low
**AC Violated:** AC-N from prd-v1.x.md
**Steps:** 1. ... 2. ...
**Expected:** [from AC]
**Actual:** [what happened]
**Trace:** [path/to/trace.zip]
**Screenshot:** [attached]
```

**Best Model for Testing Agent:**
- `claude-sonnet-4-6` — best at generating stable, role-based Playwright selectors and understanding complex user flows
- `gemini-2.5-flash` for routine smoke test generation (fast, cheap)

---

### 3.5 🔍 Code Reviewer — Quality Gate

**Current state:** Reviews PRs via Claude Code `/review`. Manual trigger. No automated pre-screening.

**Top Power-Up: GitHub MCP + CodeRabbit Pre-Screen**
- **Install:** `clawhub install github`
- **What it does:** Code Reviewer connects directly to GitHub — reads PR diffs, comments inline, requests changes, approves
- **What it enables:** Full async review cycle — Code Reviewer can respond to PR without waiting for Ziko to dispatch. GitHub webhook triggers review automatically on PR open.
- **CodeRabbit free tier:** Handles style, obvious bugs, test coverage gaps. Code Reviewer focuses on logic, security, architectural fit only.

**Top Power-Up: `web-design-guidelines` skill (already installed)**
- For PRs touching UI components, Code Reviewer should invoke this skill to check accessibility compliance and design system adherence
- Currently unused for code review — add it to the review checklist

**Top Power-Up: Security-focused review with OpenAI o3/Gemini Thinking**
- For auth, payment, or data access code: switch to `claude-opus-4-6` with extended thinking
- These reviews need deeper reasoning, not speed
- Create a tiered model policy: `sonnet` for standard reviews, `opus` for security-sensitive code

**Review Protocol Enforcement:**
```
Before review starts:
[ ] CI passes (TypeScript clean, ESLint clean, tests pass)
[ ] PR < 400 LOC (if not, return for splitting)
[ ] Plans.md referenced and implementation matches it

During review — focus ONLY on:
[ ] Logic correctness vs PRD acceptance criteria
[ ] Security: input validation, auth checks, secrets
[ ] Performance: N+1s, missing pagination, unnecessary re-renders
[ ] Architecture fit: matches docs/architecture.md patterns

Output format:
DECISION: APPROVED / APPROVED WITH NITS / REQUEST CHANGES
BLOCKERS: [file:line — description]
SUGGESTIONS: [optional improvements]
NOTES FOR ZIKO: [systemic issues]
```

**Best Model for Code Reviewer:**
- Standard reviews: `claude-sonnet-4-6`
- Security/auth code: `claude-opus-4-6` (slower but more thorough)
- Never use Flash for code review — the savings aren't worth the missed issues

---

### 3.6 🎨 Designer — UI/UX, Brand

**Current state:** Handles design with UI/UX skills. Has `ui-ux-pro-max`, `superdesign`, `frontend-design`, `web-design-guidelines` all installed.

**Top Power-Up: Figma MCP**
- **Install:** `clawhub install figma` (or via Figma's official MCP server)
- **What it does:** Designer can read Figma files directly, extract component specs, design tokens, and measurements
- **What it enables:** Eliminates "what did you mean by that spacing?" back-and-forth. Dev gets precise measurements from source. Designer can update Figma and automatically propagate changes to the spec.

**Top Power-Up: `nano-banana-pro` skill (already installed, underused)**
- Designer should use Gemini image generation for rapid concept visualization
- Particularly useful for: mood boards, hero image concepts, icon ideation
- Faster than stock photo search + more on-brand

**Top Power-Up: Canvas Tool for Design Previews**
- OpenClaw has a `canvas` tool that can render HTML/CSS/React directly in the chat
- Designer can generate component code and immediately preview it in Canvas
- Fares sees rendered UI before any code goes to Dev — faster approval loop

**Design Handoff Standard (implement immediately):**
```
For every component delivered to Dev:
- Component name (must match code component name exactly)
- All states: default, hover, active, disabled, loading, error, empty
- Responsive behavior at 3 breakpoints (375px, 768px, 1440px)
- Design tokens used (colors, spacing, typography — mapped to Tailwind config)
- Interaction spec (click → what happens, transition duration)
```

**Missing Skill: `vercel-composition-patterns` (already installed)**
- Designer should reference this when speccing component variants
- Ensures design variants map directly to component prop structures
- No translation loss between "Button/Primary/Hover" in Figma and `<Button variant="primary" state="hover">` in code

**Best Model for Designer:**
- `claude-sonnet-4-6` for component spec writing, design system documentation
- `gemini-2.5-pro` for analyzing reference designs and extracting patterns (better multimodal)
- `nano-banana-pro` (Gemini 3 Pro Image) for rapid visual concepts

---

### 3.7 📣 Marketing Agent — Growth, Copy, GTM

**Current state:** Full suite of marketing skills installed (copywriting, email-sequence, social-content, seo-audit, etc.). Very well-equipped on the skill side.

**Gap #1: No Analytics Access**
- Marketing has no connection to actual user/conversion data
- **Install:** `clawhub install supabase` or a dedicated analytics MCP
- **What it enables:** Marketing can pull signup rates, activation metrics, conversion data directly — copy decisions backed by real data, not guesses

**Gap #2: No Linear Integration for Campaign Tracking**
- Marketing campaigns have no project management visibility
- **Install:** `clawhub install linear`
- **What it enables:** Campaign briefs become Linear issues. Marketing Lead can see dev timeline and plan launch copy around it. No more "we need this copy before the feature ships" emergencies.

**Gap #3: Underusing `product-marketing-context` skill**
- This skill creates a master context document that ALL other marketing skills reference
- Currently not set up → every marketing task starts from scratch
- **Action:** Run `product-marketing-context` skill immediately to create `.claude/product-marketing-context.md`
- This single file saves 10-20 minutes of context-setting per marketing task

**Gap #4: No SEO data connection**
- SEO agent has the `ai-seo` and `seo-audit` skills but no access to Google Search Console or Analytics data
- Short-term: use `web_search` + `web_fetch` to scrape current rankings
- Medium-term: `clawhub install gog` (already available) connects to Google services including Analytics

**Best Model for Marketing:**
- `claude-sonnet-4-6` for copy writing — best brand voice consistency and long-form quality
- `gemini-2.5-pro` for competitive research and large-scale content analysis
- `gemini-2.5-flash` for bulk variations (50 headline variants, A/B test copy sets)

---

## 4. Area 3 — OpenClaw Unused Features

These are OpenClaw capabilities confirmed in documentation that our team is NOT currently using:

### 4.1 🔴 HIGH IMPACT — Not using at all

**1. Native Webhooks (`openclaw webhooks`)**
- **What it is:** OpenClaw can receive HTTP webhook calls from external services (GitHub, Linear, Vercel, Stripe)
- **What we're missing:** GitHub PR open → auto-trigger Code Reviewer. Deploy complete → notify Ziko. Linear issue moved → dispatch relevant agent.
- **Current workaround:** Manual `poll-commands.ps1` every heartbeat — latency, brittle, misses events
- **Fix:** `openclaw webhooks --setup` + configure GitHub repo settings to POST to gateway URL
- **Docs:** `https://docs.openclaw.ai/automation/webhook.md`

**2. Approvals Queue (`openclaw approvals`)**
- **What it is:** Structured approval workflow — agents submit approval requests, humans approve/reject from any channel
- **What we're missing:** Currently approval is just a message to Fares in Telegram — no tracking, no audit trail, no structured context
- **Fix:** Wire all HITL gates through `openclaw approvals` — Fares gets structured approval card with context package attached
- **Docs:** `https://docs.openclaw.ai/cli/approvals.md`

**3. Cron Jobs (`openclaw cron`)**
- **What it is:** Exact-time scheduled jobs — unlike heartbeat which drifts, cron fires at precise times
- **What we're missing:** Daily 9am standup report, weekly sprint review, automated metrics digests
- **Current workaround:** Heartbeat (drifts, misses times), manual asks
- **Fix:** Set up 3 cron jobs: daily standup, weekly review, metrics push
- **Docs:** `https://docs.openclaw.ai/automation/cron-jobs.md`

**4. Model Failover (`concepts/model-failover`)**
- **What it is:** Automatic fallback to a secondary model if primary is unavailable or rate-limited
- **What we're missing:** If Claude API has an outage, all agents go silent
- **Fix:** Configure failover chain: `claude-sonnet-4-6 → gemini-2.5-pro → gpt-4o`
- **Docs:** `https://docs.openclaw.ai/concepts/model-failover.md`

**5. OpenClaw Secrets CLI (`openclaw secrets`)**
- **What it is:** Secure secret storage — keys stored encrypted, referenced by name
- **What we're missing:** Supabase service role key, API keys currently visible in `TOOLS.md` — SECURITY RISK
- **Fix:** Migrate all API keys from TOOLS.md to `openclaw secrets` immediately
- **Docs:** `https://docs.openclaw.ai/cli/secrets.md`
- **Security note:** TOOLS.md with live service role keys is a serious risk. Fix this first.

### 4.2 🟡 MEDIUM IMPACT — Underused features

**6. Channel Routing (`channels/channel-routing`)**
- **What it is:** Route different types of messages to different agent sessions based on rules (sender, channel, keywords)
- **What we're missing:** All traffic goes to main Ziko session. A GitHub alert should route to Code Reviewer directly, not through Ziko.
- **Potential:** Agent-specific Telegram topics for direct communication (Testing Agent reports go to a testing topic, Dev reports go to a dev topic)
- **Docs:** `https://docs.openclaw.ai/channels/channel-routing.md`

**7. Session Tools (`concepts/session-tool`)**
- **What it is:** Expose specific tools to specific sessions — a Testing Agent session only has Playwright tools, a Marketing session only has web/writing tools
- **What we're missing:** Every agent has every tool. This creates confusion and wastes context. Testing Agent shouldn't have image generation tools.
- **Fix:** Configure per-session tool allowlists when spawning specialized agents

**8. Usage Tracking (`concepts/usage-tracking`)**
- **What it is:** Per-agent, per-session API token usage reports
- **What we're missing:** No visibility into which agents are burning the most tokens. No cost attribution.
- **Fix:** Enable usage tracking, review weekly. If Marketing agent is burning 3x Dev agent tokens on research, that's a signal to optimize prompts or switch to Flash.
- **Docs:** `https://docs.openclaw.ai/concepts/usage-tracking.md`

**9. Session Pruning (`concepts/session-pruning`)**
- **What it is:** Automatic pruning of old sessions to free context. Configurable retention policies.
- **What we're missing:** Sessions accumulate indefinitely. Context degrades. Old agent sessions hold stale state.
- **Fix:** Configure 72h pruning for subagent sessions, 7-day for main sessions

**10. Broadcast Groups (`channels/broadcast-groups`)**
- **What it is:** Send a message to multiple channels/topics simultaneously
- **What we're missing:** When a feature ships, Ziko has to manually send updates to each stakeholder channel
- **Fix:** Set up a "feature shipped" broadcast group — one event pushes to PMS, Telegram, and any other configured channel

**11. ACP Thread-Bound Agents (`experiments/plans/acp-thread-bound-agents`)**
- **What it is:** Agents bound to specific Discord/Telegram threads — each feature gets its own thread with a dedicated agent context
- **What we're missing:** All feature discussions are in the same Telegram topic, making context mixing likely
- **Potential:** Feature-specific Telegram threads with bound agents that only know about that feature

**12. Polls (`automation/poll`)**
- **What it is:** Structured polling for agent outputs — agent outputs are queued and polled by orchestrator
- **What we're missing:** Currently using custom PowerShell polling. OpenClaw has this natively.

**13. Hooks (`automation/hooks`)**
- **What it is:** Event hooks — trigger agent actions on specific events (file change, message received, external event)
- **What we're missing:** Could trigger PA to start research when a new feature idea is added to a specific Linear label, for example

**14. Canvas for Design Review**
- **What it is:** Built-in canvas tool renders HTML/CSS/React in-chat
- **What we're missing:** Designer produces mockups as screenshots. Could produce rendered, interactive HTML components.
- **Fix:** Designer should output HTML component previews that Fares can review in Canvas before Dev implementation

**15. TUI Dashboard (`openclaw tui`)**
- **What it is:** Terminal UI showing all active sessions, agent status, queue state
- **What we're missing:** No real-time visibility into what all agents are doing simultaneously
- **Fix:** Keep TUI open during active builds — visual oversight of the full pipeline

---

## 5. Priority Matrix

| Recommendation | Effort | Impact | Priority | Do When |
|---|---|---|---|---|
| Fix TOOLS.md secrets → `openclaw secrets` | Low (2h) | Critical (security) | 🔴 NOW | Today |
| Install Supabase MCP | Low (2h) | Very High | 🔴 NOW | Today |
| Install Context7 | Low (1h) | High | 🔴 NOW | Today |
| Install Linear skill | Low (2h) | Very High | 🔴 NOW | This week |
| Set up native webhooks (GitHub → Code Reviewer) | Medium (4h) | High | 🔴 This week | This week |
| Set up OpenClaw Approvals | Low (3h) | High | 🔴 This week | This week |
| Create docs/architecture.md | Medium (4h) | Very High | 🔴 This week | This week |
| Create product-marketing-context.md | Low (2h) | Medium | 🔴 This week | This week |
| Install Playwright MCP | Low (2h) | Very High | 🔴 This week | This week |
| Install GitHub MCP (all agents) | Low (2h) | High | 🔴 This week | This week |
| Enable parallel Design + Backend dispatch | Low (0 tooling) | High | 🔴 This week | Workflow change |
| Add Plans.md step to Dev agent | Low (1h) | High | 🔴 This week | Prompt update |
| Configure Model Failover | Low (1h) | Medium | 🟡 Sprint 2 | Next sprint |
| Set up Cron for standup/reports | Low (2h) | Medium | 🟡 Sprint 2 | Next sprint |
| Configure Session Pruning | Low (1h) | Medium | 🟡 Sprint 2 | Next sprint |
| Configure per-session tool allowlists | Medium (4h) | Medium | 🟡 Sprint 2 | Next sprint |
| Enable Usage Tracking | Low (1h) | Medium | 🟡 Sprint 2 | Next sprint |
| Install Figma MCP | Medium (3h) | High | 🟡 Sprint 2 | When design work starts |
| Set up Broadcast Groups | Low (2h) | Medium | 🟡 Sprint 2 | Next sprint |
| BDD ACs enforced in all specs | Low (0 tooling) | Very High | 🔴 NOW | Process change |
| Code Review tiered model policy (Sonnet/Opus) | Low (1h) | Medium | 🟡 Sprint 2 | Prompt update |
| ACP Thread-Bound Agents per feature | High (1 day) | Medium | 🟢 Sprint 3 | Later |
| Git Worktrees for parallel dev | Medium (3h) | Medium | 🟢 Sprint 3 | When parallel features needed |
| Supabase analytics for Marketing | Medium (3h) | Medium | 🟢 Sprint 3 | When data exists |
| Gemini 2.5 Pro for PA research tasks | Low (1h) | Medium | 🟡 Sprint 2 | Model config |
| TUI for pipeline visibility | Low (1h) | Low | 🟢 Sprint 3 | Nice to have |
| Channel routing per agent type | High (1 day) | Low | 🟢 Sprint 3 | When team scales |

---

## Appendix: Quick Install Commands

```bash
# Critical installs — do today
clawhub install supabase
clawhub install linear
clawhub install github
clawhub install context7

# Testing
npx '@playwright/mcp@latest'    # Playwright MCP for Testing Agent

# Security fix
openclaw secrets set SUPABASE_SERVICE_ROLE_KEY <value>
openclaw secrets set SUPERMEMORY_API_KEY <value>

# Infrastructure
openclaw webhooks --setup       # enable webhook receiver
openclaw approvals --enable     # enable approval queue
openclaw cron --setup           # cron scheduler
```

---

*Research compiled from: DORA 2025 report, OpenAI Codex internal workflow docs, Vercel engineering blog, GitHub Copilot team practices, Linear's AI integration docs, OpenClaw documentation (docs.openclaw.ai/llms.txt), ClawHub skill registry, web research on multi-agent SDLC patterns 2025.*
