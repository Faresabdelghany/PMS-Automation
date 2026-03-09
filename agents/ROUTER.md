# Agent Router — Cheat Sheet

Ziko uses this to route natural language commands to the correct agent automatically.

---

## Natural Language → Agent Mapping

### Product Analyst 🧠
**Triggers:** "spec", "plan", "define", "requirements", "feature", "what should we build", "break this down", "PRD", "user stories", "analyze this idea", "scope this", "research", "investigate", "market research", "competitive analysis"

**Examples:**
- "Spec out a billing dashboard"
- "Break down this feature into tasks"
- "Research how competitors handle onboarding"
- "Plan the next sprint"
- "Define the requirements for notifications"

### Dev 🛠️ (always via Product Analyst)
**Triggers:** "build", "implement", "code", "fix bug", "add feature", "create page", "deploy", "refactor", "migrate", "update the API", "add endpoint"

**Examples:**
- "Build the settings page" → routes to PA first, then Dev
- "Fix the login bug" → routes to PA for spec, then Dev
- "Add Stripe integration" → PA specs it, Dev builds it

### Testing Agent 🧪
**Triggers:** "test", "QA", "verify", "check if it works", "run tests", "find bugs", "validate", "regression", "coverage"

**Examples:**
- "Test the new billing flow"
- "Run E2E tests on the dashboard"
- "Check if the auth fix works"
- "Validate the migration didn't break anything"

### Code Reviewer 🔍
**Triggers:** "review", "check the code", "audit", "code quality", "security review", "PR review", "sign off"

**Examples:**
- "Review the billing PR"
- "Audit the auth module for security"
- "Check code quality on the latest push"
- "Sign off on the dashboard feature"

### Designer 🎨
**Triggers:** "design", "UI", "UX", "layout", "mockup", "wireframe", "component", "visual", "look and feel", "dark mode", "responsive"

**Examples:**
- "Design the onboarding flow"
- "Create a layout for the settings page"
- "How should the dashboard look?"
- "Design a better empty state"

### Marketing Agent 📣
**Triggers:** "marketing", "SEO", "copy", "landing page", "email sequence", "campaign", "ads", "growth", "positioning", "content strategy", "social media", "CRO", "pricing"

**Examples:**
- "Write copy for the homepage"
- "Create an email onboarding sequence"
- "SEO audit the marketing site"
- "Plan a Product Hunt launch"
- "Write LinkedIn posts about PMS"

### Job Search Agent 💼
**Triggers:** "job", "apply", "resume", "cover letter", "job search", "applications", "career", "hiring", "LinkedIn jobs", "Wuzzuf"

**Examples:**
- "Find PM jobs in Egypt"
- "Apply to 10 jobs today"
- "Draft a cover letter for this role"
- "Check new listings on LinkedIn"
- "Update my application tracker"

---

## Quick Command Shortcuts

Use these shortcuts in chat for instant dispatch:

| Shortcut | Agent | Action |
|---|---|---|
| `/spec [topic]` | 🧠 Product Analyst | Spec out a feature |
| `/plan [topic]` | 🧠 Product Analyst | Create implementation plan |
| `/tasks [feature]` | 🧠 Product Analyst | Generate task list |
| `/research [topic]` | 🧠 Product Analyst | Research and analyze |
| `/build [feature]` | 🛠️ Dev (via PA) | Full pipeline: spec → build → test → review |
| `/fix [issue]` | 🛠️ Dev (via PA) | Bug fix pipeline |
| `/test [feature]` | 🧪 Testing Agent | Run tests on a feature |
| `/review [feature]` | 🔍 Code Reviewer | Code review latest changes |
| `/design [page]` | 🎨 Designer | Design a page or component |
| `/copy [page]` | 📣 Marketing | Write marketing copy |
| `/seo [topic]` | 📣 Marketing | SEO audit or optimization |
| `/campaign [topic]` | 📣 Marketing | Plan a marketing campaign |
| `/launch [product]` | 📣 Marketing | Plan a product launch |
| `/jobs [query]` | 💼 Job Search | Search and prepare applications |
| `/apply [count]` | 💼 Job Search | Apply to N jobs today |
| `/status` | ⚡ Ziko | Pipeline status check |
| `/agents` | ⚡ Ziko | List all agents and current state |

---

## Multi-Agent Pipelines (Compound Commands)

These trigger the full automated chain:

| Command | Pipeline |
|---|---|
| `/ship [feature]` | PA → Dev → Testing → Reviewer → Done |
| `/sprint [goals]` | PA breaks into tasks → Dev implements all → Testing → Review |
| `/audit [area]` | Testing + Reviewer run in parallel on existing code |
| `/launch [product]` | Marketing + Designer collaborate on launch assets |
| `/fullstack [feature]` | PA + Designer (UI) + Dev + Testing + Review — the works |

---

## Routing Rules (for Ziko)

1. **Single-agent tasks**: Route directly to the matching agent
2. **Build requests**: ALWAYS go through Product Analyst first (never direct to Dev)
3. **Ambiguous requests**: Ask one clarifying question, then route
4. **Multi-domain tasks**: Split and dispatch to multiple agents in parallel where possible
5. **"Do everything"**: Trigger the full `/ship` pipeline
6. **Emergency fixes**: PA can fast-track a minimal spec, then Dev immediately

## Escalation Phrases

If Fares says any of these, Ziko takes immediate action:

- "Stop everything" → Halt all active agents
- "Priority change" → Reorder pipeline
- "Ship it" → Skip remaining review, push to production
- "Rollback" → Dev reverts last deployment
- "Status report" → All agents report current state
