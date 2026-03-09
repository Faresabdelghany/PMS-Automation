# Consolidated Plan: AI System Prompts & Agent Reliability

**Date:** 2026-02-23  
**For:** Fares  
**From:** Ziko (Main Assistant)  
**Synthesized From:** Researcher, Product Analyst, Omar (Tech Lead), Karim (Marketing Lead) recommendations + OpenClaw Docs analysis.

---

## Executive Summary: A Foundational Shift

This isn't just about tweaking agent prompts; it's about making our 24 AI agents genuinely *reliable*, *trustworthy*, and *effective* at scale. The analysis of the `x1xhlol/system-prompts-and-models-of-ai-tools` repo, combined with our OpenClaw system context, reveals immediate, high-ROI actions that will:

1.  **Reduce Agent Failure:** Prevent premature stops, hallucinations, and mistakes.
2.  **Boost User Trust:** Agents will "finish the job," "verify their work," and "speak naturally."
3.  **Create a Unique Moat:** Solidify PMS's positioning as "The first PM tool built for teams running AI agents."
4.  **Enable Revenue:** Make the Mission Control demo credible, driving sales and paid plans.

**Overall Strategic Priorities (Product Analyst View):**

1.  **Billing (Your Pending Action):** Remains #1 priority. No revenue without it.
2.  **Prompt Audit & Patch:** #2 priority. It's a multiplier, making everything else more effective.
3.  **Mission Control Demo Video (+ Homepage):** #3 priority. Critical for external communication and sales.

---

## Key Findings & Recommendations by Lead:

### 1. Engineering (Omar - Tech Lead): Immediate, High-ROI Fixes

**Critical Gaps Identified:**
*   **"Keep Going Until Done" (ALL 24 Agents):** Agents stop prematurely, declaring victory too early.
*   **"Never Guess - Use Tools" (ALL 24 Agents):** Agents hallucinate rather than verify with tools.
*   **No Planning/Execution Separation (5 High-Stakes Agents):** Backend, DevOps, Outreach, Ads, Nabil lack checkpoints for irreversible actions.
*   **Monolithic Prompts (All Specialists):** `engineering-specialists.md` and `marketing-specialists.md` are unmaintainable.
*   **Missing Output Formatting Rules (Most Specialists):** Inconsistent, noisy output.

**Omar's #1 Recommendation: The "Three-Line Patch" (2 hours for Mostafa)**
*   Implement three foundational instructions across *all 24 agents by EOD tomorrow*. These are cheap, high-impact guardrails.
    1.  "Keep working until the task is fully complete before stopping or reporting up."
    2.  "When uncertain about any fact, data, or system state — use your available tools to verify. Never guess or fabricate information."
    3.  "Declare your plan before any irreversible action. State what you're about to do, what's permanent, and what could go wrong."
*   **Full 5-Day Prompt Audit Sprint:** A detailed plan to follow the patch, addressing monolithic prompts, adding explicit formatting, and refining planning/execution.
*   **Planning/Execution Mode:** Essential for the 5 high-stakes agents. Can be implemented via mandatory pre-action declarations in prompts, leveraging OpenClaw's `exec-approvals` for human checkpoints.
*   **Model-Specific Prompts:** Not urgent for Sonnet vs. Opus, but Omar recommends an Opus-specific reasoning protocol for Nabil + Omar now (10-line addition).

### 2. Marketing (Karim - CMO): Storytelling the "Engineered Reliability"

**Marketing Opportunity:**
*   **Positioning:** Benchmark our agents against "production-grade AI systems used by millions of developers" — focus on *our output reliability*, not the source of our insights (zero legal risk).
*   **Content:** "What Makes an AI Agent Actually Reliable? The 5 Patterns Top Tools Use" — targets our ICP, intercepts search intent, educates on our unique strengths.
*   **Competitive Messaging:** Translate technical improvements into *felt benefits*: "agents that finish," "agents that verify," "agents that speak naturally."
*   **Demo Impact:** Redesign the Mission Control demo around 4 emotional moments: Unbroken Chain, Verification, Natural Voice, Approval Gate, to build trust and desire.

**Karim's #1 Recommendation: Paired Campaign (7 days)**
*   Publish the "5 Patterns" article + the Mission Control demo video as a single, powerful campaign across all channels *within 7 days*.

### 3. Product Strategy (Product Analyst): The "Multiplier Effect"

**Product Impact:**
*   **Roadmap Acceleration:** Prompt audit *accelerates* demo/agent milestones and enables the client portal, but *does not displace billing*.
*   **User Value:** Moves PMS from a "toy" to a "product" by making agents reliable and delegable. Users stop babysitting.
*   **Competitive Moat:** While prompt patterns are copyable quickly, the *full workflow integration* (agents + client portal + HITL approvals) takes competitors 6-12 months. Ship the demo story first.

**Product Analyst's #1 Recommendation:**
*   Run the prompt audit, patch the 3 foundational gaps across all 24 agents, and record the demo. This is the highest leverage move after billing.

---

## Ziko's Consolidated Recommendation & Next Steps for Fares:

This plan is sequenced for maximum impact and minimal upfront friction.

1.  **PRIORITY 1 (YOU): Apply Supabase Migrations IMMEDIATELY.**
    *   **Action:** Copy/paste `supabase/migrations/20260223000001_mission_control.sql` and `supabase/migrations/20260223000002_mc_sprint2.sql` into Supabase Dashboard → SQL Editor.
    *   **Why:** These are blocking all Mission Control features from working.

2.  **PRIORITY 2 (ENGINEERING): Execute the "Three-Line Patch" Across All 24 Agents by EOD Tomorrow.**
    *   **Action:** Omar to have Mostafa implement the 3 core instructions in all agent prompts.
    *   **Why:** Highest ROI, lowest effort. Immediate boost to agent reliability, making all subsequent work more effective and the demo more compelling.

3.  **PRIORITY 3 (PRODUCT + MARKETING): Initiate Mission Control Demo Video & Homepage Rewrite.**
    *   **Action:** Karim + Product Analyst to begin planning and drafting for the demo video script and homepage copy, leveraging the new positioning and agent reliability story.
    *   **Why:** Once the 3-line patch is in, the demo will reflect genuinely reliable agents, and the homepage can tell that story.

4.  **PRIORITY 4 (ENGINEERING): Begin the Full 5-Day Prompt Audit Sprint.**
    *   **Action:** After the 3-line patch is verified and demo/homepage work is underway, Omar's team starts the deeper 5-day audit.
    *   **Why:** This systematically addresses all remaining prompt architecture, unbundles specialists, and refines planning/execution modes.

---

**This is a comprehensive and actionable plan, Fares. Your move.**
