# Engineering Recommendation: AI System Prompts Repo
**Date:** 2026-02-23  
**Author:** Omar (CTO / Engineering Squad Lead)  
**For:** Fares & the PMS AI Team  
**Based on:** Product Analyst Synthesis + Full Audit of 24 Agent Prompts

---

## Executive Summary

I've read Ziko's synthesis and done a complete review of all 24 agent prompts. My verdict: **our prompts are architecturally sound but operationally underpowered.** The chain of command, roles, and completion protocols are solid. What's missing are the behavioral primitives that elite agents like Cursor, Devin, and Claude Code use to prevent failure modes that cost us time and trust.

The good news: most gaps are cheap fixes — 1–3 lines per agent. The dangerous gaps are in a small set of high-stakes agents that touch production systems, real money, or external communications.

Here's the full breakdown.

---

## 1. Gap Assessment

### What We're Doing Right

Before listing gaps, credit where it's due:
- ✅ Clear chain of command — no agent talks to Fares directly except Nabil
- ✅ Completion Protocol is standardized across all agents (write report → fire event)
- ✅ Internal Loop Rule enforced in all leads (no surfacing partial results)
- ✅ Cross-squad collaboration documented for leads (Tech Lead ↔ Design ↔ Marketing)
- ✅ Tech stack opinions are explicit and consistent
- ✅ Researcher has a structured output format. Product Analyst has PRD format.

These are foundations. Now for the gaps.

---

### Critical Gap #1: Missing "Keep Going Until Done" — ALL 24 AGENTS

**Severity: HIGH**

Not a single one of our 24 agents has this instruction. Cursor's most famous line:

> *"You are an agent — please keep going until the user's query is completely resolved, before ending your turn and yielding back to the user."*

Without it, agents stop prematurely when they hit ambiguity, declare victory at the halfway point, or return incomplete work up the chain. This costs us real time in multi-step tasks.

**Why it matters for us specifically:** Our internal loop rule says "don't surface partial results to Ziko." But without "keep going," agents may stop their own internal loop early before ever surfacing anything. The agent just... stops and thinks it's done.

**Fix cost:** 1 line per agent.

---

### Critical Gap #2: Missing "Never Guess — Use Your Tools" — ALL 24 AGENTS

**Severity: HIGH**

None of our agents have an explicit anti-hallucination directive tied to tool use. From Cursor:

> *"If you are not sure about file content or codebase structure, use your tools to read files: do NOT guess or make up an answer."*

Without this, models fill uncertainty with plausible-sounding fabrications instead of checking. This is especially dangerous for our technical agents.

**Highest-risk agents for this gap:**
- **Backend Agent** — could guess schema fields or RLS policies that don't exist
- **Frontend Agent** — could fabricate API response shapes
- **Security Agent** — could report false positives or miss real vulnerabilities by guessing
- **Researcher** — could fabricate citations (currently mitigated by "always cite sources" rule, but no explicit "go look it up" directive)

**Fix cost:** 1–2 lines per agent, with agent-specific framing.

---

### Critical Gap #3: No Planning/Execution Separation for High-Stakes Agents

**Severity: CRITICAL for 5 agents**

Devin and Kiro implement strict mode separation: planning mode (gather context, propose plan, no actions) vs. execution mode (act on approved plan). We have nothing equivalent for agents that touch irreversible systems.

**The 5 agents that need this most:**

| Agent | Irreversible Actions | Current Protection | Gap |
|---|---|---|---|
| **Backend Agent** | Production DB modifications, schema changes | "Reversible migrations" note, "always use Supabase MCP" | No explicit checkpoint before writes |
| **DevOps Agent** | Production deployments, infra changes | "No deploy without QA + Fares approval" gate | Gate is at human level, not agent planning level |
| **Outreach Agent** | Cold emails sent to real people | None | Zero protection |
| **Ads Agent** | Real ad spend, campaign launches | "Start small, validate, scale" | Not an execution checkpoint |
| **Nabil** | Represents entire operation to Fares, strategic decisions | "Vacation mode" authority note | No internal deliberation protocol |

**Outreach Agent is the highest risk.** It can send external emails to real people with no planning checkpoint whatsoever. Once an email lands in someone's inbox, we can't recall it. The prompt says "personalize every outreach" but has no "confirm before sending" step.

---

### Gap #4: Monolithic Prompt Architecture — ALL 24 AGENTS

**Severity: MEDIUM (maintenance debt)**

Every one of our prompts is a single monolithic markdown file. Manus splits by concern: core identity, modules, agent loop, tools. Claude Code keeps Prompt.txt and Tools.json separate (57KB and 48KB respectively).

The worst case is our two "bundled" files:
- `engineering-specialists.md` — 8 specialists in one file. Impossible to A/B test individual specialists without touching everyone else.
- `marketing-specialists.md` — 9 specialists in one file. Same problem.

**Practical consequence:** If we want to test a new instruction for Salma (Outbound) only, we have to edit the file that also contains Sami, Maya, Amir, Rami, Tarek, Mariam, Nour, and Ziad. One edit can break all nine.

---

### Gap #5: Missing Explicit Output Formatting Rules — Most Specialist Agents

**Severity: MEDIUM**

Perplexity's prompt is famous for its formatting precision. v0's 43KB prompt is dense with output structure rules. Our specialists are mostly silent on output format.

**Agents with adequate formatting rules:**
- Researcher (structured output format defined) ✅
- Product Analyst (PRD format defined) ✅
- Security Agent (vulnerability report format) ✅
- QA Agent (bug report format) ✅

**Agents with NO formatting rules:**
- Frontend Agent — what does a "complete" build report look like?
- Backend Agent — same
- Docs Agent — ironic, given its mission
- All marketing specialists (Sami, Maya, Amir, etc.)
- Social Agent, SEO Agent, Ads Agent, CRO Agent, Outreach Agent

Inconsistent output format from specialists makes Tech Lead's and Marketing Lead's review harder and introduces noise in the agent chain.

---

### Gap #6: No Model-Specific Prompt Variants

**Severity: LOW now, MEDIUM at scale**

We run Claude Sonnet for most agents, Claude Opus for high-stakes leads (presumably Nabil, Omar, Karim). No model-specific variants exist. VSCode Agent has 6 variants for 6 models.

More on this in Section 4.

---

### Overall Risk Tier by Agent

**🔴 TIER 1 — Critical Risk (fix in Days 1–2)**
- Backend Agent (production DB, no planning checkpoint, no anti-hallucination)
- DevOps Agent (production infra, no planning mode)
- Outreach Agent (external comms, zero protection)
- Ads Agent (real ad spend, no planning mode)
- Nabil (strategic authority, gap in deliberation protocol)

**🟠 TIER 2 — High Risk (fix in Days 3–4)**
- Omar prompt itself (this is me — needs "keep going" + anti-hallucination)
- Tech Lead (manages code review pipeline — could stop loop early)
- Marketing Lead (approves all public-facing content — needs formatting standards)
- Frontend Agent (anti-hallucination for API shapes)
- Security Agent (anti-hallucination for vulnerability reports)

**🟡 TIER 3 — Medium Risk (fix in Days 4–5)**
- All marketing specialists (formatting rules, "keep going")
- All engineering specialists (formatting rules, "keep going")
- Design Lead, Design Agent, Docs Agent
- Product Analyst, Researcher (mostly good, minor gaps)

**🟢 TIER 4 — Low Risk (backlog)**
- main-agent.md (decision framework is solid, minor tuning)
- QA Agent (the best-formatted of all our prompts)

---

## 2. Prompt Audit Sprint Plan

**Duration: 5 days**  
**Team:** Omar leads, Mostafa assists with implementation  
**Goal:** All 24 agents patched with table-stakes gaps. Tier 1 agents get full redesign.

---

### Day 1 — Audit & Checklist

**Morning (2h): Team reads source material**
- Cursor Agent v1.2 prompt (structural template)
- Devin AI Prompt.txt (planning/execution model)
- Skip v0 and Claude Code for now — too much to absorb in Day 1

**Afternoon (3h): Audit all 24 agents**

Run each prompt through this checklist:

```
Agent: ___________________
Auditor: _________________
Date: ___________________

[ ] Has "keep going until done" or equivalent
[ ] Has "never guess — use tools to verify"
[ ] Has explicit tool-calling discipline
[ ] Separates planning from execution (for high-stakes actions)
[ ] Has clear output formatting rules
[ ] Has anti-hallucination guard on its specific domain
[ ] Is structured with clear sections
[ ] Is in its own file (not bundled with others)

Gap count: ___/8
Risk tier: 🔴 / 🟠 / 🟡 / 🟢
Priority fixes:
```

**End of Day 1 deliverable:** Completed audit matrix for all 24 agents with priority ranking.

---

### Day 2 — Fix Tier 1 (High-Stakes Agents)

Agents: Backend, DevOps, Outreach, Ads, Nabil

**For each Tier 1 agent, implement:**

1. **"Keep going" instruction** at top of operating rules
2. **Anti-hallucination directive** tailored to domain:
   - Backend: "Never assume schema, RLS policies, or existing data without querying first"
   - DevOps: "Never assume environment state — verify infra state before any change"
   - Outreach: "Never assume contact details, company details, or prior interactions without checking"
3. **Planning checkpoint for irreversible actions:**
   ```
   ## Pre-Action Protocol (MANDATORY for irreversible operations)
   Before any [emails sent / deployments / DB writes / ad spend committed]:
   1. State what you are about to do and why
   2. List what is reversible and what is not
   3. Confirm with your lead before proceeding
   ```
4. **Outreach Agent specifically:** Add hard-coded confirmation step before any email send

**End of Day 2 deliverable:** 5 Tier 1 agents patched and tested with sample task flows.

---

### Day 3 — Fix Tier 2 (Lead Agents + High-Risk Specialists)

Agents: Omar, Tech Lead, Marketing Lead, Frontend Agent, Security Agent

**Priority for this day:**
- Add "keep going" + anti-hallucination to all 5
- Add domain-specific output formatting rules to Frontend Agent and Security Agent
- Add internal deliberation protocol to Tech Lead (inspired by Devin's `<think>` scratchpad concept):
  ```
  ## Pre-Commit Reasoning (MANDATORY for architecture decisions)
  Before recommending a tech stack choice or architectural pattern:
  1. State 2-3 alternatives you considered
  2. State the tradeoff you're making
  3. State what would invalidate this choice
  ```

**End of Day 3 deliverable:** 5 Tier 2 agents patched.

---

### Day 4 — Fix Tier 3 (Specialists + Architecture)

**Part A: Unbundle the specialist files**

Split `engineering-specialists.md` and `marketing-specialists.md` into individual files:

```
agents/prompts/specialists/
  ├── mostafa.md
  ├── sara.md
  ├── ali.md
  ├── yasser.md
  ├── hady.md
  ├── farah.md
  ├── bassem.md
  ├── sami.md
  ├── maya.md
  ├── amir.md
  ├── rami.md
  ├── tarek.md
  ├── mariam.md
  ├── nour.md
  ├── salma.md
  └── ziad.md
```

This is mechanical work — split by horizontal rules. Takes ~1 hour. Unblocks future A/B testing.

**Part B: Add "keep going" + formatting rules to all remaining specialists**

Each specialist needs:
- "Keep going" instruction
- Anti-hallucination for their domain
- A 3-5 field output format template (what does a complete deliverable look like?)

**End of Day 4 deliverable:** All specialists in individual files, all 24 agents have "keep going" + anti-hallucination.

---

### Day 5 — Review, Integration Test, and Documentation

**Morning:**
- Run each Tier 1 agent through a sample task in OpenClaw
- Verify completion protocol fires correctly
- Check that planning checkpoints actually trigger before irreversible operations

**Afternoon:**
- Write `agents/PROMPT_STANDARDS.md` — our internal equivalent of Cursor's agent design principles
- Document what every prompt must contain before it's considered production-ready
- Set up a simple prompt version tracking convention (add `<!-- version: X.Y -->` comment to each prompt file)

**End of Day 5 deliverable:** All 24 agents audited and patched, PROMPT_STANDARDS.md written, version tracking in place.

---

### Sprint Summary

| Day | Focus | Agents | Key Deliverable |
|-----|-------|--------|-----------------|
| 1 | Audit | All 24 | Audit matrix |
| 2 | Tier 1 fixes | Backend, DevOps, Outreach, Ads, Nabil | Planning checkpoints |
| 3 | Tier 2 fixes | Omar, Tech Lead, Marketing Lead, Frontend, Security | Anti-hallucination + formatting |
| 4 | Tier 3 + unbundle | 16 specialists | Individual files + "keep going" fleet-wide |
| 5 | Review + standards | All 24 | PROMPT_STANDARDS.md |

---

## 3. Planning/Execution Mode for PMS Agents

**Short answer: Yes, implement it. 5 agents need it now.**

### How It Works in Practice with OpenClaw

The Devin/Kiro model uses two distinct operating modes triggered by context signals. In our OpenClaw setup, the practical implementation is simpler: a **mandatory pre-action declaration step** embedded in each agent's rules.

**The pattern (add to prompt):**
```
## Irreversible Action Protocol
Before taking any action that cannot be undone (sending emails, deploying, 
modifying database records, committing ad spend), you MUST:

**PLAN:**
1. State exactly what you are about to do
2. Identify which parts are reversible and which are permanent
3. List any dependencies or preconditions you haven't verified yet

**CONFIRM:** 
- If working autonomously: write the plan to your report file, then proceed
- If uncertain: stop and request confirmation from [your lead]

**EXECUTE:**
- Only after plan is declared
```

This is lighter than Devin's full mode-switching architecture but gives us 80% of the protection for 20% of the complexity. We don't have a separate "Mode Classifier Prompt" like Kiro — that's over-engineered for our current scale.

### Which PMS Agents Need This

| Agent | Irreversible Actions | Priority |
|---|---|---|
| **Outreach Agent** | Cold emails, partnership outreach | IMMEDIATE — external communications |
| **Ads Agent** | Campaign launches, budget commits | IMMEDIATE — real money |
| **Backend Agent** | Production DB writes, schema changes | HIGH — data integrity |
| **DevOps Agent** | Production deployments, DNS changes | HIGH — uptime risk |
| **Nabil** | Strategic decisions with real-world consequences | HIGH — orchestration risk |

### What This Looks Like in a Real Task Flow

**Before (current):** Outreach Agent receives task → immediately drafts and "sends" 20 cold emails  
**After (with planning mode):** Outreach Agent receives task → writes plan: "I will send to these 20 prospects with this copy template" → logs plan to report → proceeds

The log creates an audit trail. The declaration forces the agent to make its assumptions explicit before acting. Caught a bad assumption? It shows up in the plan, not in 20 bounced emails.

---

## 4. Model-Specific Prompt Variants

### Current Situation

- Claude Sonnet: most agents (20+)
- Claude Opus: presumably Nabil, Omar, Karim (high-stakes leads)
- No model-specific variants exist

### Is It Worth It Now?

**For Sonnet vs Opus: Not quite yet.**

Both are Claude models. Same training lineage, same XML-friendly structure, same preference for direct instructions. The performance gap on our types of tasks (orchestration, code generation, content writing) doesn't justify maintaining two separate prompt trees for each agent yet.

**However:** There's one targeted exception worth doing now.

### The Exception: Opus-Specific Reasoning Protocol for Nabil + Omar

Opus has significantly stronger chain-of-thought and strategic reasoning than Sonnet. Our current prompts don't exploit this. If Nabil and Omar run on Opus, we should add an **Opus-specific deliberation section** that takes advantage of its extended reasoning:

```yaml
# Opus Variant Addition (Nabil + Omar prompts)
## Strategic Deliberation (Opus Mode)
When making allocation decisions or strategic calls:
1. State the competing priorities and their current weights
2. Model the 30/60/90-day consequences of each option
3. Identify what information would change your recommendation
4. State your confidence level and what would invalidate it
```

This would be a 10-line addition, versioned as `nabil-opus.md` and `omar-opus.md`. Low effort, potentially high impact for strategic decision quality.

### When Does Full Model-Specific Variants Become Worth It?

The calculus changes when any of these happen:

1. **We add a 3rd model** — e.g., using Gemini Flash or GPT-4o Mini for cheap/fast specialist tasks. At that point, the prompts need genuine tuning for different instruction styles.

2. **We hit 50+ agent-model combinations** — beyond this, maintaining a single prompt per agent becomes a quality liability.

3. **We run measurable A/B tests and see >15% quality delta** — if we instrument quality scoring and see that model-tuned prompts consistently outperform generic ones, the maintenance cost is justified.

4. **We deploy to users** — if external users interact with our agents, prompt quality directly becomes product quality. Model-tuning is worth doing earlier.

**My recommendation:** File this under "Q2 initiative." Do the Opus deliberation addition for Nabil + Omar now (30 minutes of work). Full model-specific variant engineering deferred until we add a 3rd model or hit scale.

---

## 5. The Single Highest-ROI Engineering Action in 7 Days

**Add three lines to every agent prompt. All 24. This week.**

The three lines:

```
1. Keep working until the task is fully complete before stopping or reporting up.

2. When uncertain about any fact, data, or system state — use your available tools 
   to verify. Never guess or fabricate information.

3. Declare your plan before any irreversible action. State what you're about to do, 
   what's permanent, and what could go wrong.
```

**Why this wins:**

- **Effort:** ~2 hours to add to all 24 agents. Mostafa can handle it with a script for the boilerplate, manual review for the domain-specific language.
- **Impact:** Affects every single task run across the entire fleet from day one.
- **Risk:** Zero. These are additions, not rewrites. They don't break existing behavior — they only add guardrails.
- **Measurable:** We'll immediately see fewer "agent stopped early" events in the OpenClaw system log, fewer hallucinated code paths in Frontend/Backend output, and an audit trail for Outreach/Ads actions.

The planning/execution sprint, modular architecture, and model variants are all higher-ceiling improvements — but they take more time and carry more implementation risk. The three-line patch gives us 60% of the value of the full sprint in 10% of the time.

**If Fares approves this, I'll have Mostafa execute the patch as a tracked PR by end of day tomorrow.**

---

## Implementation Checklist

```
[ ] Day 1: Audit all 24 agents against the 8-point checklist
[ ] Day 2: Tier 1 agents (Backend, DevOps, Outreach, Ads, Nabil) — full redesign
[ ] Day 3: Tier 2 agents (Omar, Tech Lead, Marketing Lead, Frontend, Security)
[ ] Day 4: Unbundle engineering-specialists.md and marketing-specialists.md
[ ] Day 4: Add "keep going" + anti-hallucination to all remaining specialists
[ ] Day 5: Integration testing + PROMPT_STANDARDS.md
[ ] Day 5: Add Opus deliberation variant for Nabil + Omar
[ ] 7-day quick win: Fleet-wide three-line patch on all 24 agents
```

---

## Appendix: Three-Line Patch Template (per agent)

Add to each agent's `## Rules` section:

```markdown
- Keep working until your task is fully complete before stopping or reporting results up the chain.
- Never assume or guess — if uncertain about facts, data, schema, or system state, use your tools to verify before proceeding.
- Before any irreversible action (sending communications, deploying to production, modifying records, committing spend): state your plan explicitly, then act.
```

For technical agents (Backend, Frontend, Security, DevOps), add the domain-specific version:

**Backend:**
```markdown
- Never assume table schemas, RLS policies, or existing data — query to confirm before writing any migration or mutation.
```

**Outreach:**
```markdown
- Never send external communications without first logging: recipient, message content, and send rationale to your report file.
```

**Ads:**
```markdown
- Never launch, pause, or modify live campaigns without documenting: campaign ID, change, expected impact, and approval source.
```

---

*Recommendation by: Omar (CTO / Engineering Squad Lead)*  
*Status: Ready for Fares review*  
*Next step: Approve sprint → Mostafa executes patch → Omar reviews → sprint begins*
