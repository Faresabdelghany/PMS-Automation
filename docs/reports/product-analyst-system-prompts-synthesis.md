# Product Analyst Synthesis: AI System Prompts Repo
**Date:** 2026-02-23  
**Author:** Ziko (Product Analyst subagent)  
**Based on:** Researcher's Brief by Ziko (Researcher subagent)  
**For:** Fares & the PMS AI team

---

## Executive Summary

The GitHub repo `x1xhlol/system-prompts-and-models-of-ai-tools` is the single most valuable free resource available right now for anyone building production AI agents. It contains leaked, credibly real system prompts from 28+ top-tier AI tools — Cursor, Devin, v0, Claude Code, Windsurf, Perplexity, Manus, and more.

**This is not theory. It's the actual source code of how the world's best agent teams prompt their AIs.**

For Fares and the PMS team running a 24-agent squad, this is essentially a free competitive intelligence audit of the industry's best practices. Reading these prompts will reveal gaps in our own agents that would otherwise take months of trial-and-error to discover.

---

## What Is This Repo? (Plain Language)

Think of it like this: every AI tool you use (Cursor, ChatGPT with tools, Devin, etc.) has a hidden "instruction manual" that gets sent to the AI model before every conversation. That instruction manual is the **system prompt** — it defines the AI's personality, rules, tools, and behaviors.

This GitHub repo is a collection of those instruction manuals, extracted from real commercial products by an independent researcher. It has **118,000+ GitHub stars** and **30,000+ forks**, making it one of the most-starred repos of 2025. The community has validated it extensively.

**Is it real?** Yes, with ~85-90% confidence. The prompts are internally consistent, version-tracked, and match publicly known facts about each product. The open-source prompts in the repo match their actual codebases exactly — which validates the methodology.

---

## What's Most Relevant for PMS?

Out of 28+ tools covered, here are the ones with highest relevance to what we're building:

| Tool | Why It Matters for PMS |
|---|---|
| **Cursor Agent (v1.2)** | Cleanest example of a production coding/task agent prompt. Best structural template. |
| **Devin AI** | Blueprint for a software project management agent. Planning/execution separation is directly applicable. |
| **v0 (Vercel)** | 43KB of detail on output formatting, multi-step web tasks — relevant for our report-generating agents. |
| **Claude Code** | Closest analog to our setup (we use Claude). 57KB prompt with full tool definitions. |
| **VSCode Agent** | Demonstrates model-specific prompt tuning — one product, 6 different prompts for 6 models. |
| **Manus Agent** | Modular prompt architecture (split files by concern). Best structural lesson for large agent systems. |
| **Perplexity** | Template for any agent that synthesizes research or generates reports. |
| **NotionAI** | 34KB tools.json — directly useful if PMS integrates with Notion. |
| **Cluely Enterprise** | "Always-on assistant" model — relevant for PMS monitoring/observation agents. |

---

## Key Findings & What They Mean for Us

### Finding 1: We're Likely Missing "Table Stakes" Instructions

Every single production-quality agent prompt in this repo contains these foundational instructions that probably aren't in all 24 of our agents:

**"Keep going until done"**
> *"You are an agent — please keep going until the user's query is completely resolved, before ending your turn and yielding back to the user."* — Cursor

Without this, agents stop prematurely, declare victory too early, or hand incomplete work back to the user. This single line increases task completion rates significantly.

**"Never guess — use your tools"**
> *"If you are not sure about file content or codebase structure, use your tools to read files and gather the relevant information: do NOT guess or make up an answer."* — Cursor  
> *"Don't assume content of links without visiting them."* — Devin

Without this explicit instruction, models hallucinate rather than look things up. It must be stated directly — models don't infer it from tool availability alone.

**"Never mention tool names to the user"**
> *"NEVER refer to tool names when speaking to the USER. Instead, say what the tool is doing in natural language."* — Cursor

Saying "I will call `execute_query`" is jarring and confusing to end users. Good agents abstract tool mechanics away.

**What this means for PMS:** These three rules alone are worth a prompt audit. They're cheap to add (1-3 lines each) and meaningfully change agent behavior.

---

### Finding 2: The Best Tools Separate Planning from Execution

Devin, Kiro, and Orchids all implement distinct operating modes:

- **Planning mode:** The agent gathers context, proposes a plan, asks questions — but takes NO irreversible actions.
- **Execution mode:** The agent carries out approved steps.

Devin's prompt has an explicit `<think>` scratchpad tool for reasoning before critical decisions, with strict rules about when to use it (3 mandatory situations, 5 optional ones).

Kiro has a **Mode Classifier Prompt** — a separate prompt file that decides which mode to enter before the main prompt even fires.

**What this means for PMS:** Any PMS agent that handles financial data, sends external communications, or modifies database records should be redesigned with this two-mode pattern. The current risk is: an agent that can both plan AND execute without a checkpoint is prone to making costly mistakes from misunderstood requirements.

**Where to apply this first:** The highest-stakes 3-5 agents (wherever data modifications or external notifications happen). Use Devin's mode-switching structure as the template.

---

### Finding 3: Prompt Architecture Should Be Modular

Manus Agent stores its configuration across multiple files:
- `Prompt.txt` — core identity and rules
- `Modules.txt` — feature modules the agent can activate
- `Agent_loop.txt` — the operational loop logic
- `tools.json` — full tool definitions

Kiro splits its prompts by mode: `Mode_Classifier_Prompt.txt`, `Vibe_Prompt.txt`, `Spec_Prompt.txt`.

Claude Code's `Prompt.txt` is 57KB and `Tools.json` is 48KB — kept separate so each can evolve independently.

**What this means for PMS:** If any of our 24 agents have one giant monolithic prompt file, that's a maintenance liability. Split by concern:
1. **Identity + core rules** (who the agent is, what it won't do)
2. **Task-specific instructions** (the current mode or task type)
3. **Tool definitions** (kept separate and version-controlled)
4. **Output formatting rules** (kept separate so they can be reused across agents)

This also makes it easier to run A/B tests on specific sections without touching the entire prompt.

---

### Finding 4: Model-Specific Prompts Are an Engineering Requirement, Not a Nice-to-Have

VSCode Agent has **6 different prompt files for the same product** — one per model:
- `gpt-4o`, `gpt-4.1`, `gpt-5`, `gpt-5-mini`, `claude-sonnet-4`, `gemini-2.5-pro`

This isn't redundancy — it's engineering reality. Different models respond differently to identical phrasing:
- Claude responds best to direct XML-structured instructions
- GPT models respond better to numbered lists and explicit rules
- Gemini needs different context-length management strategies

**What this means for PMS:** If our 24-agent squad runs on multiple models (Claude for complex reasoning, cheaper models for simpler tasks), using the same system prompt across all models leaves quality on the table. This is a **meaningful, measurable improvement** waiting to happen.

---

### Finding 5: Output Formatting Rules Should Be Exhaustive

Perplexity's prompt is famous for its granular formatting rules: citation format, LaTeX handling, when to use bullets vs. prose, maximum list item counts, response length per query type, etc.

v0's 43KB prompt contains extensive rules about how to structure code blocks, explanations, and multi-step responses.

**What this means for PMS:** Any of our agents that generate reports, summaries, or structured output are probably producing inconsistent formatting because we haven't been explicit enough. The cure isn't smarter models — it's more precise formatting rules in the prompt.

---

## How to Use This Repo (Tactical Guide)

### Phase 1: Read the Right Prompts First (2-3 hours)

Don't try to read all 30,000 lines. Start here, in this order:

1. **`Cursor Prompts/Agent Prompt v1.2.txt`** — Best structural template. Read this first.
2. **`Devin AI/Prompt.txt`** — Best planning/execution model. Read this second.
3. **`v0 Prompts and Tools/Prompt.txt`** — Best output formatting rules.
4. **`Anthropic/Claude Code/Prompt.txt`** — Most relevant (we use Claude). Skim for patterns.
5. **`VSCode Agent/`** (folder) — Browse to see model-specific variants side by side.

**Skip for now:** Lovable, Leap, Orchids (less directly applicable), open-source tools (Bolt, Cline — you can read the source yourself).

### Phase 2: Prompt Audit of Our 24 Agents (1 day sprint)

Using Cursor v1.2 and Devin as benchmarks, review each of our 24 agent prompts and check:
- [ ] Does it have "keep going until done"?
- [ ] Does it have "never guess, use your tools"?
- [ ] Does it have explicit tool-calling discipline?
- [ ] Is it structured with clear sections (XML tags or headers)?
- [ ] Does it separate formatting rules from logic rules?
- [ ] Does it have a planning checkpoint before irreversible actions?

Flag any agent that fails 3+ of these checks as a priority rewrite.

### Phase 3: Redesign the Top 5 Critical Agents (1-2 week sprint)

For the highest-stakes PMS agents:
1. Split into modular files (identity, task logic, tools, formatting)
2. Implement planning/execution mode separation
3. Create 2-3 model-specific variants if we're running multiple models
4. Add explicit formatting rules to report-generating agents

### Phase 4: Ongoing Reference

Bookmark the repo. When we build a new PMS agent, start by asking: "Which existing prompt from this repo is the closest analog to what we're building?" Use it as a starting template, then customize.

---

## Top 3 Actionable Takeaways

### #1 — Run a Prompt Audit Against Cursor + Devin as the Gold Standard

**What:** Schedule a 1-day sprint where the team reads Cursor Agent v1.2 and Devin AI Prompt.txt, then compares all 24 of our agent prompts against those benchmarks using the checklist above.

**Why:** We will almost certainly find that multiple agents are missing the "keep going" instruction, the "never guess" rule, and explicit tool discipline. These are cheap fixes with high ROI.

**Expected outcome:** Identify 5-10 quick wins that can be shipped in a day, and 3-5 deeper rewrites to schedule.

---

### #2 — Implement Planning/Execution Mode for Our Highest-Stakes Agents

**What:** Redesign the 3-5 PMS agents that touch financial data, send external notifications, or modify records with an explicit two-mode architecture — planning mode (no actions, only proposals) and execution mode (acts on approved plan).

**Why:** This is the single biggest structural improvement we can make to agent reliability. The best tools in the world (Devin, Kiro, Orchids) all do this. It dramatically reduces costly mistakes from misunderstood requirements.

**Expected outcome:** Fewer runaway agent errors on high-stakes operations. More user confidence in automated workflows.

---

### #3 — Create Model-Specific Prompt Variants for Multi-Model Deployments

**What:** For the top 5 most-used PMS agents, create separate prompt variants tuned for Claude vs. GPT vs. whatever cheaper model we use for simpler tasks. Run a quality measurement before and after.

**Why:** VSCode Agent does this across 6 models because it materially improves output quality. One-size-fits-all prompts leave performance on the table when switching models.

**Expected outcome:** Measurable quality improvement on agents running non-Claude models. Better cost/quality tradeoffs as we scale.

---

## Risk & Caveats

- **Prompts may be slightly outdated** — tools update frequently. Use them as structural inspiration, not as copy-paste.
- **Manus's "prompt" is not the real internal prompt** — it's their public capability description. Treat it differently.
- **Copyright/legal gray area** — these are leaked proprietary prompts. Don't publish them or claim them as our own. Use them for internal learning only.
- **Context matters** — some patterns (like Cursor's coding-specific rules) don't directly translate to PMS workflows. Adapt, don't blindly copy.

---

## Links

- **Repo:** https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools
- **DeepWiki analysis:** https://deepwiki.com/x1xhlol/system-prompts-and-models-of-ai-tools
- **Researcher's full brief:** `docs/reports/researcher-system-prompts-repo.md`

---

*Synthesis written by: Ziko (Product Analyst subagent)*  
*Based on Researcher's Brief (2026-02-23)*
