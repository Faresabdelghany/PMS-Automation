# Context Package Template
Every task dispatched by Ziko to any agent MUST include this structure.
No agent receives a task without a filled context package.

```json
{
  "task_id": "feat-XXX-[short-name]",
  "from": "ziko",
  "to": "[agent-name]",
  "context": {
    "feature": "[Feature name and one-line description]",
    "prd_path": "/docs/specs/[feature-name]/prd-v1.x.md",
    "prior_decisions": [
      "[Decision already made — do not re-litigate]",
      "[Decision already made — do not re-litigate]"
    ],
    "do_not_revisit": [
      "[Explicitly out of scope — do not implement]",
      "[Explicitly out of scope — do not implement]"
    ],
    "current_state": "[What has been done so far in the pipeline]",
    "next_step": "[Exactly what this agent needs to do]"
  },
  "outputs_expected": [
    "[Deliverable 1 — e.g. PR link]",
    "[Deliverable 2 — e.g. report file path]"
  ],
  "escalate_if": [
    "[Condition that requires stopping and notifying Ziko]",
    "[Condition that requires stopping and notifying Ziko]"
  ]
}
```

## Escalation Triggers Per Agent

| Agent | Escalate When |
|---|---|
| 🧠 Product Analyst | Conflicting requirements, missing business context, unclear success metric |
| 🛠️ Dev | Ambiguous architecture decision, external API unclear, task scope > 2 days, >3 new files unexpected |
| 🧪 Testing Agent | >20% test failure rate on first run (spec problem), blocker bug found in core flow |
| 🔍 Code Reviewer | Security vulnerability found, architectural flaw, PR > 400 LOC |
| 🎨 Designer | Missing brand direction, conflicting UX requirements |
| 📣 Marketing | ICP not defined, no product capability backing a marketing claim |

## Iteration Limits

| Agent | Limit | What Happens at Limit |
|---|---|---|
| 🛠️ Dev | Max 3 revision cycles per feature | Escalate to Ziko — spec may be broken |
| 🧪 Testing Agent | Max 10 bugs filed per feature | Escalate — likely a spec problem, not individual bugs |
| 🔍 Code Reviewer | 24h max to complete review | Auto-escalate to Ziko |

## Usage
Ziko fills this template before every agent dispatch.
Save completed context packages to: `/docs/specs/[feature-name]/context-[agent]-v1.json`
