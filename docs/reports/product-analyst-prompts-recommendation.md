# Product Strategy Recommendation: Applying AI System Prompt Insights to PMS
**Author:** Ziko (Product Analyst subagent)  
**Date:** 2026-02-23  
**Input docs:** `product-analyst-system-prompts-synthesis.md`, `product-analysis.md`  
**Audience:** Fares & PMS core team  

---

## Upfront: The Strategic Context

Before answering the five questions, one fact must anchor everything:

> **PMS is currently pre-revenue.** The product analysis scores business readiness at 2/10. Billing doesn't exist. The single most urgent need is to flip the revenue switch.

Every recommendation below is written with that constraint in mind. The prompt audit and agent improvements are real, valuable, and worth doing — but they must be sequenced correctly, or they become a productivity trap that delays the moment PMS becomes a business.

---

## Question 1: Product Roadmap Impact

### Does applying these lessons accelerate or shift PMS's priorities?

**Short answer:** It shifts one priority upward and clarifies the product thesis — but it does NOT change what comes first.

### What shifts:

**The AI agent story gets a concrete deliverable.**  
The product analysis already identified "Make one AI agent do something real" as Priority #3 — the demo that creates the press/sales hook. The system prompts research now gives us a *specific, achievable path* to that demo: run a 1-day prompt audit, apply the "keep going until done" + "never guess, use your tools" fixes, and suddenly existing agents complete tasks reliably instead of stalling. The demo becomes possible *without* new infrastructure — just better prompts.

This is a significant roadmap acceleration. The gap between "agents don't do anything visible" and "agent writes a project report that PM approves" shrinks from a 4-week engineering sprint to potentially a 3-day prompt improvement sprint.

**Planning/execution mode separation unblocks the client portal launch.**  
The client portal is Priority #1 differentiator (per the product analysis). When clients can approve deliverables inside PMS, the agents that *generate* those deliverables need to be trustworthy. A planning/execution mode separation in the 2-3 highest-stakes agents (report generation, client communication drafts, task auto-assignment) is the architectural prerequisite that makes the client portal feel safe to launch. This means the prompt architecture work directly enables the client portal milestone — it's not a detour, it's part of the path.

**Model-specific prompts are a later optimization, not a blocker.**  
If PMS currently runs all agents on Claude, this can wait. It becomes relevant the moment cost-optimization requires routing simpler tasks to cheaper models. Flag it for Month 3–6, not now.

### What does NOT shift:

**Billing comes first.** Full stop. The prompt improvements make the product better. Billing makes it a business. These serve completely different goals and the prompt audit cannot substitute for Stripe. No amount of agent quality improvement generates revenue without a payment flow.

**The homepage rewrite and ICP focus remain parallel tracks.** Better agents don't fix "too broad market positioning." The homepage still needs to say "for agencies" before word-of-mouth can compound.

---

## Question 2: User Value — What Would a User Actually See Differently?

### Current experience (without the prompt improvements):

An agency technical lead logs into PMS and asks an AI agent to generate a weekly status report. The agent:
- Starts the task
- Gets partway through, then stops and asks a clarifying question
- If the user is distracted or doesn't respond in the session, the work is abandoned
- Or worse: the agent makes up data it doesn't know, because it wasn't told to look it up

The user experience: **unreliable, needs babysitting, not worth trusting.**

### Experience after prompt audit + fixes:

The same user asks the same agent for a status report. Now:
- The agent **keeps going until done** — it scans all tasks, pulls timeline data, checks completion rates, and assembles a full draft without stopping to ask
- If it doesn't know a piece of data, it **uses its tools** to look it up instead of guessing
- When it's done, it says "Here's your weekly status report draft — I've flagged 3 tasks that are behind schedule. Ready to send to the client?" in natural language, **never mentioning internal tool names**
- The user reviews, makes minor edits, and approves — one click sends it to the client portal

**The difference is trust.** Users don't experience "better prompts" — they experience an agent they can delegate to and walk away from. That's the product moment that drives retention, word of mouth, and willingness to pay.

### Specific visible improvements by feature area:

| PMS Feature | Before (current) | After (prompt improvements) |
|---|---|---|
| Report generation | Partial output, stops mid-task | Complete draft, ready to approve |
| Task auto-assignment | May hallucinate team member availability | Queries the actual project data |
| Client update drafts | Generic/inaccurate if context is missing | Grounded in real task/milestone data |
| HITL approval flow | Agent may re-execute after approval due to ambiguity | Clear planning → execution gate; no re-runs |
| Multi-step project setup | Drops steps if session is interrupted | Runs to completion in one pass |

---

## Question 3: Competitive Moat — Is This Defensible?

### Can PMS build a moat here, and how long before competitors copy it?

**Yes, but the moat is not "better prompts" — the moat is the workflow integration.**

Here's the honest breakdown:

**What's easy to copy (not a moat):**
- The specific prompt patterns ("keep going," "never guess") — any competitor with a developer can add these in a day once they read the same repo
- Planning/execution mode as an architectural pattern — it's documented in leaked prompts that 118K developers have starred
- Modular prompt files — pure engineering practice, no defensibility

**What's hard to copy (potential moat):**
- **PMS-specific workflow integration** — An agent that knows about PMS projects, tasks, clients, milestones, and approval flows is only useful inside PMS. Competitors would need to rebuild the entire PM workflow context, not just the prompt pattern.
- **The client portal + agent approval loop** — When an agent generates a deliverable, the client approves it in the portal, and the task is automatically marked complete — that's a closed-loop workflow that requires deep PM data integration. Competitors need months to build the equivalent data model.
- **The HITL approvals architecture** — PMS already has this infrastructure. Combining it with properly-prompted agents creates something that's genuinely hard to replicate from scratch in a quarter.
- **Trust and reputation** — The first company to publish a credible case study ("Agency X saved 8 hours/week using PMS agents for client reporting") owns the narrative. That's a marketing moat that lasts 12–18 months even if a competitor ships the same feature.

**Timeline for competitive copy:**
- Prompt patterns alone: **1-4 weeks** for a funded competitor with engineering resources
- Full planning/execution mode with PM workflow integration: **3-6 months**
- Client portal + agent-generated deliverables + HITL approvals, all working together: **6-12 months** — only if the competitor starts NOW and knows what they're building

**The honest verdict:** Ship it before the story leaks. The value isn't in the pattern being secret — the value is in being the first PM tool to *demonstrate* this combination working end-to-end in production. First-mover in a demonstration beats second-mover with a better implementation 70% of the time in the SMB SaaS market.

---

## Question 4: Build Order

### Where does the prompt audit rank vs. Stripe billing, homepage rewrite, demo video?

Here is the honest priority stack, with reasoning:

---

**RANK 1 — Stripe Billing**  
*Blocks: everything. Urgency: this week.*

Without billing, PMS is a free product. Every day of delay is a day of lost learning on unit economics. No prompt improvement changes this.

**Time estimate:** 3-5 days for basic Stripe + 2 subscription tiers (Free + Pro).

---

**RANK 2 — Prompt Audit Sprint**  
*Unlocks: demo video, agent reliability, ICP pitch. Urgency: this month.*

This ranks ABOVE the homepage rewrite and demo video because it's the prerequisite for both. You cannot film a compelling demo video of an agent that stops mid-task and asks clarifying questions. The homepage rewrite is about marketing — but if the product doesn't work reliably when journalists or early adopters try it, the homepage copy doesn't matter.

The prompt audit also has the best time-to-value ratio on the entire backlog:
- **Time investment:** 1-day audit + 2-day quick wins implementation = 3 days total
- **Value unlock:** Agents complete tasks reliably → demo video becomes possible → case studies become possible → sales pitch becomes credible

The prompt audit is a **multiplier** on everything that comes after it. Do it second.

**Time estimate:** 1 day audit, 2-3 days quick wins, 1 week for the top 5 agent rewrites with planning/execution modes.

---

**RANK 3 — Demo Video**  
*Unlocks: Product Hunt, press, inbound. Urgency: after agents work.*

Once billing exists and agents work reliably, film the demo. Not before. A demo video of a broken product is worse than no demo — it permanently anchors the first impression of every investor and journalist who sees it.

The demo should show exactly this: *"Agent generates weekly client report → PM reviews → one-click sends to client portal → client approves in portal → task marked complete."* That's the moat story in 45 seconds.

**Time estimate:** 1-2 days to film/edit once the agent works.

---

**RANK 4 — Homepage Rewrite**  
*Unlocks: SEO, ICP clarity, word-of-mouth. Urgency: before Product Hunt.*

The homepage must say "for agencies" before the Product Hunt launch. But it can be written while the demo is being filmed — they're parallel tracks, not sequential. The homepage rewrite doesn't need the agents to work; it just needs the ICP decision to be made (which should already be made: agencies).

**Time estimate:** 2-3 days for copy + redesign of hero section.

---

### Recommended sequence:

```
Week 1:   Stripe billing (basic Free + Pro tiers)
Week 2:   Prompt audit + quick wins (3-line fixes across all 24 agents)
Week 3:   Top 5 agent rewrites (planning/execution modes + modular structure)
Week 4:   Demo video (record the agent doing the full client report loop)
          Homepage rewrite (run in parallel — different person/session)
Week 5+:  Product Hunt launch
          Client portal MVP
          First paying customer outreach
```

---

## Question 5: The Single Most Strategically Important Thing

### In the next 30 days, what is the ONE thing PMS must do with these insights?

**Run the prompt audit and fix the "keep going" + "never guess" gaps across all 24 agents — then record the demo that proves it.**

Here is why this is the single answer:

1. **It's the cheapest, fastest improvement with the highest compound return.** A 1-day sprint to audit and patch the 3 foundational gaps (keep going, never guess, no tool name leakage) will make every agent measurably more reliable. This is $0 engineering cost against a massive quality improvement.

2. **It unlocks the demo, which unlocks everything else.** The first PMS paying customer will almost certainly come from someone who saw the demo. The demo needs agents that work. The prompt audit makes agents work. This is the critical path.

3. **It validates the core product thesis before billing ships.** If you ship Stripe and agents are still broken, early paying customers will churn immediately. The prompt audit de-risks the first billing cycle by ensuring the product is worth paying for.

4. **It differentiates the sales pitch in the next 30 days.** When Fares does outbound to agencies this month ("want to try PMS?"), having agents that reliably complete tasks makes the trial experience defensible. Without it, trials end with "interesting, but it's not quite there yet."

**What "done" looks like for this recommendation:**
- All 24 agents audited against the Cursor + Devin checklist
- Top 3 gaps (keep going, never guess, tool name abstraction) patched across all agents
- Top 5 highest-stakes agents redesigned with planning/execution mode separation
- One agent (report generator or project setup assistant) demonstrating the full task loop end-to-end
- Demo recorded

---

## Risks & Honest Caveats

**Risk 1 — The prompt audit becomes a rabbit hole.**  
Timebox it strictly: 1 day audit, 1 day quick wins, no more. The goal is "good enough to demo" not "perfect." Perfect prompts are an infinite project. Ship the demo first.

**Risk 2 — The planning/execution mode adds friction.**  
If the approval checkpoint is annoying (too many confirmations, too slow), users will disable it. Design the checkpoint to be fast: one card showing the plan, one approve button. The friction must be lower than the fear of an agent making a mistake.

**Risk 3 — Billing still can't wait.**  
Even if the prompt audit sprint goes perfectly, Stripe must ship in parallel or first. The prompt improvements don't generate revenue. They make revenue worth generating.

**Risk 4 — Model-specific prompts before cost pressure arrives is premature optimization.**  
Don't build 6 model variants yet. Wait until you have 50+ paying customers and actual cost data showing which agents are expensive to run. Then optimize.

---

## Summary Table

| Question | Answer |
|---|---|
| Roadmap impact? | Accelerates the demo/agent milestone; directly enables client portal launch. Does not replace billing as #1 priority. |
| User value? | Users experience agents they can trust to run to completion — delegation, not babysitting. That drives retention and word of mouth. |
| Competitive moat? | The prompt patterns themselves: 1-4 weeks to copy. The full workflow integration: 6-12 months. Ship the demo story before competitors tell it. |
| Build order? | Stripe → Prompt Audit → Demo Video (+ Homepage in parallel) → Product Hunt |
| Single most important action? | Run the prompt audit, fix the 3 foundational gaps, record the demo that shows agents completing real work. Do it in the next 2 weeks. |

---

## Appendix: The Exact Audit Checklist (For the Sprint)

Use this when reviewing each of the 24 agents:

- [ ] Does it have an explicit "keep going until the task is completely done" instruction?
- [ ] Does it have an explicit "never guess — use your tools to look up information you don't have"?
- [ ] Does it tell the agent to describe tool actions in natural language (not tool names)?
- [ ] Are instructions structured with clear sections (XML tags or numbered headers)?
- [ ] Are formatting rules separated from logic rules?
- [ ] Does it have a planning checkpoint before irreversible actions (data writes, external sends)?
- [ ] Are tool definitions current and complete?
- [ ] Is there an explicit definition of "done" for the agent's primary task type?

**Flag any agent failing 3+ checks as a priority rewrite.**  
**Flag any agent touching external systems or data writes as a planning/execution redesign candidate.**

---

*Recommendation by: Ziko (Product Analyst subagent)*  
*Session: product-analyst-prompts | 2026-02-23*
