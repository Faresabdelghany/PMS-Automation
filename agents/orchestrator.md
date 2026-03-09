# Agent Orchestration — Multi-Agent System

## Architecture

```
Fares (Human)
  └── Ziko (AI Orchestrator)
        └── Nabil (Supreme Commander)
              │
              ├── Product Analyst (Hub — defines WHAT to build)
              │     └── Researcher (market, user, technical, competitive research)
              │
              ├── Omar / Tech Lead (CTO — defines HOW to build)
              │     ├── Frontend Agent
              │     ├── Backend Agent
              │     ├── DevOps Agent
              │     ├── Security Agent
              │     ├── QA Agent
              │     └── Documentation Agent
              │
              ├── Design Lead (defines HOW it looks)
              │     └── Design Agent
              │
              └── Karim / Marketing Lead (CMO — defines HOW it launches)
                    ├── SEO Agent
                    ├── Content Agent
                    ├── Social Agent
                    ├── Outreach Agent
                    ├── CRO Agent
                    └── Ads Agent
```

**Cross-squad direct communication (leads talk to each other):**
```
Product Analyst ←→ Tech Lead      (feasibility, specs)
Product Analyst ←→ Design Lead    (UX brief, user research)
Product Analyst ←→ Marketing Lead (positioning, launch)
Tech Lead       ←→ Design Lead    (constraints → designs → implementation)
Tech Lead       ←→ Marketing Lead (copy/assets → integration → launch timing)
Design Lead     ←→ Marketing Lead (brand consistency, campaign visuals)
```

## Agent Registry — Product Development (11)

| # | Agent | Role | Model | Prompt |
|---|-------|------|-------|--------|
| 1 | Main Agent | Product Owner / CEO | claude-opus-4-6 | main-agent.md |
| 2 | Tech Lead | CTO | claude-opus-4-6 | tech-lead.md |
| 3 | Frontend Agent | Frontend Engineer | claude-sonnet-4-6 | frontend-agent.md |
| 4 | Backend Agent | Backend Engineer | claude-sonnet-4-6 | backend-agent.md |
| 5 | Design Lead | Head of Design | claude-sonnet-4-6 | design-lead.md |
| 6 | Design Agent | UI/UX Designer | claude-sonnet-4-6 | design-agent.md |
| 7 | QA Agent | Gatekeeper | claude-sonnet-4-6 | qa-agent.md |
| 8 | DevOps Agent | Cloud Engineer | claude-sonnet-4-6 | devops-agent.md |
| 9 | Security Agent | Security & Compliance | claude-sonnet-4-6 | security-agent.md |
| 10 | Docs Agent | Documentation | gemini-2.5-flash | docs-agent.md |
| 11 | Product Analyst | Data & Analytics | gemini-2.5-flash | product-analyst.md |

## Agent Registry — Marketing (7)

| # | Agent | Role | Model | Prompt |
|---|-------|------|-------|--------|
| 12 | Marketing Lead | CMO | claude-opus-4-6 | marketing-lead.md |
| 13 | SEO Agent | SEO Specialist | claude-sonnet-4-6 | seo-agent.md |
| 14 | Content Agent | Content Marketing | claude-sonnet-4-6 | content-agent.md |
| 15 | Social Media Agent | Social Specialist | claude-sonnet-4-6 | social-agent.md |
| 16 | Outreach Agent | Business Development | claude-sonnet-4-6 | outreach-agent.md |
| 17 | CRO Agent | Conversion Optimization | claude-sonnet-4-6 | cro-agent.md |
| 18 | Ads Agent | Paid Advertising | claude-sonnet-4-6 | ads-agent.md |

**Total: 18 agents**

## HITL Workflow

### Step 1: REQUEST
**Fares → Main Agent**: "I want to build X"

### Step 2: PLANNING
**Main Agent** drafts roadmap, feature list, estimated scope.
Consults:
- Tech Lead → architecture feasibility
- Marketing Lead → positioning, messaging, go-to-market angle
- Product Analyst → market context, metrics plan

### Step 3: 🛑 HITL GATEWAY
**Main Agent → Fares**: Presents the plan (product + marketing strategy).
- **"Approve"** → proceed
- **"Modify"** → adjust and re-present
- **NOTHING PROCEEDS UNTIL FARES APPROVES**

### Step 3.5: RESEARCH PHASE (runs between planning and production)
**Product Analyst → Researcher**: Deep research on market, users, competitors before building.
- Researcher delivers brief to Product Analyst
- Product Analyst writes final PRD + distributes to all leads
- No squad starts until PRD is approved

### Step 4: TRIGGER PRODUCTION
**Product Analyst distributes PRD to all leads simultaneously.**
Each lead gets their section: Engineering Notes → Tech Lead, Design Brief → Design Lead, Marketing Notes → Marketing Lead.

**Cross-squad collaboration — leads talk directly to each other:**

```
Product Analyst
      ↓ PRD
  ┌───┼───────────────────┐
Tech Lead    Design Lead    Marketing Lead
  │              │               │
  ├─── requests designs ──→      │
  │         designs back ←───────┤
  │                               │
  ├─── requests copy ────────────→│
  │         copy + assets back ←──┤
  │
  └─── implements with full design + copy
```

- **Tech Lead → Design Lead**: "Here are engineering constraints, I need designs for X"
- **Design Lead → Tech Lead**: Delivers approved mockups + specs
- **Tech Lead → Marketing Lead**: "Feature X ships in Y days, need copy + assets"
- **Marketing Lead → Tech Lead**: Delivers final copy + campaign assets
- Leads **do not wait for Ziko** to coordinate this — they communicate directly

### Step 5: PARALLEL BUILD
All squads run in parallel after PRD is distributed:

**Research Track:**
- Researcher → deep dives on any unknowns
- Feeds findings to Product Analyst → distributed to relevant leads

**Design Track:**
- Design Lead receives brief from Product Analyst + constraints from Tech Lead
- Design Agent builds wireframes, mockups, interaction specs
- Design Lead reviews → approves → sends final specs to Tech Lead

**Engineering Track:**
- Tech Lead waits for approved designs before assigning frontend work
- Backend Agent → APIs, database, auth (can start from PRD alone)
- Frontend Agent → UI implementation (starts after designs arrive)
- DevOps Agent → CI/CD, environments
- Security Agent → Continuous audits

**Marketing Track (parallel with engineering):**
- Marketing Lead briefs all specialists from PRD marketing notes
- Content Agent → Landing page copy, product descriptions, email sequences
- SEO Agent → Keyword strategy, meta tags, schema markup
- CRO Agent → Signup flow optimization, pricing page, CTAs
- Social Agent → Launch content, social posts, teasers
- Outreach Agent → Partnership targets, cold email sequences
- Ads Agent → Ad campaign planning, creative, targeting
- Marketing Lead delivers final copy/assets to Tech Lead before frontend integration

**Documentation Track:**
- Docs Agent → API docs, README, user guides alongside development

### Step 6: INTEGRATION
- Frontend integrates marketing copy from Content Agent
- SEO Agent reviews all pages for search optimization
- CRO Agent audits all conversion touchpoints (signup, pricing, onboarding)
- Security Agent does final audit

### Step 7: QA GATE
**QA Agent**: Tests everything — product AND marketing pages.
- 🟢 Green Light → proceed
- 🔴 Red Light → back to engineering/marketing

### Step 8: FINAL DELIVERY
**Main Agent → Fares**: Presents:
- ✅ **Live staging link** (product + marketing pages)
- 📄 **Documentation** (from Docs Agent)
- 📊 **Analytics & tracking plan** (from Product Analyst)
- 📝 **Marketing launch plan** (from Marketing Lead)
- Fares approves → DevOps ships to production

### Step 9: LAUNCH & GROWTH
Once live, Marketing Lead executes the launch plan:
- Content Agent → Publishes blog posts, sends email sequences
- Social Agent → Executes social campaign
- Outreach Agent → Starts cold outreach and partnership emails
- Ads Agent → Launches paid campaigns
- SEO Agent → Monitors rankings, iterates on content
- CRO Agent → Runs A/B tests on conversion funnels
- Product Analyst → Tracks metrics, reports to Main Agent

## Key Rules
1. **Fares approves at every major gate** (plan, design, deploy)
2. **No code before approved spec**
3. **Marketing content built alongside the product, not after**
4. **No deploy before QA green light**
5. **No production before Fares sees staging**
6. **All progress tracked in PMS**

## Spawning Agents
Agents are spawned on-demand via `sessions_spawn` with their prompt file as context.

### Output Rules
1. **EVERY sub-agent task MUST include instructions to write output to a file.** Auto-announced results can get lost. Files persist.
   - Reports go to: `docs/reports/[agent-name]-[topic].md` in the project directory
   - For Claude Code tasks: specify the output file path in the prompt
   - Never rely solely on session history — it's restricted after termination
2. **Keep sub-agent reply under 3000 chars.** Telegram has a 4096 char limit. Long reports MUST be written to files, with only a brief summary returned as the reply.
3. **Ziko summarizes before forwarding to Fares.** Never send raw sub-agent output to Telegram. Always distill to key points.

### Agent Coordination Protocol (MANDATORY)
This is the required chain — never skip steps.

**Full reporting hierarchy:**
```
Fares
  └── Ziko (orchestrator)
        └── Product Analyst (HUB — owns the full task pipeline)
              │
              ├── Tech Lead / Omar
              │     ├── Frontend Agent    → reports to → Tech Lead
              │     ├── Backend Agent     → reports to → Tech Lead
              │     ├── DevOps Agent      → reports to → Tech Lead
              │     ├── Security Agent    → reports to → Tech Lead
              │     ├── QA Agent          → reports to → Tech Lead
              │     └── Docs Agent        → reports to → Tech Lead
              │
              ├── Design Lead
              │     └── Design Agent      → reports to → Design Lead
              │
              └── Marketing Lead / Karim
                    ├── SEO Agent         → reports to → Marketing Lead
                    ├── Content Agent     → reports to → Marketing Lead
                    ├── Social Agent      → reports to → Marketing Lead
                    ├── Outreach Agent    → reports to → Marketing Lead
                    ├── CRO Agent         → reports to → Marketing Lead
                    └── Ads Agent         → reports to → Marketing Lead
```

**THE MANDATORY CHAIN — self-running, no shortcuts:**
```
Ziko → Product Analyst → Leads → Specialists
Specialists → (spawn) Lead → (spawn) Product Analyst → (event) Ziko → Fares
```

### How the chain runs itself (each agent spawns the next):

**Step 1 — Ziko spawns Product Analyst only**
```
sessions_spawn(task: "You are Product Analyst. Goal: [X]. Break it down, spawn leads.")
```
Ziko does nothing else. The chain runs automatically from here.

**Step 2 — Product Analyst spawns each Lead**
Product Analyst spawns Omar, Karim, Design Lead (whichever are needed) with their tasks.
Each lead runs independently in parallel.

**Step 3 — Each Lead spawns their specialists**
Omar → spawns Sara, Mostafa, Hady (one at a time or parallel as needed)
Karim → spawns his marketing specialists
Design Lead → spawns Design Agent

**Step 4 — Specialists spawn their Lead when done**
Sara finishes → she spawns Omar with her report path
Mostafa finishes → spawns Omar with his report path
Omar runs an internal loop: review → if issues, re-spawn specialist; if clean, spawn Hady QA

**Step 5 — Lead spawns Product Analyst when squad is done and clean**
Omar (all clean + Hady passed) → spawns Product Analyst: "Engineering done, sign-off at [path]"
Karim (all clean) → spawns Product Analyst: "Marketing done, sign-off at [path]"
Design Lead (all clean) → spawns Product Analyst: "Design done, sign-off at [path]"

**Step 6 — Product Analyst fires event to Ziko when ALL leads done**
```
openclaw system event --text "Product Analyst: ALL squads done. Report: [path]" --mode now
```

**Step 7 — Ziko reviews and tells Fares**

### Rules
- Ziko NEVER spawns specialists or leads — only Product Analyst
- Leads NEVER notify Ziko — only Product Analyst
- Specialists NEVER notify anyone except their Lead
- Product Analyst NEVER notifies Fares — only Ziko
- The chain is self-propagating: each agent spawns the next one

## Prompt Location
All prompts: `~/.openclaw/workspace/agents/prompts/`
