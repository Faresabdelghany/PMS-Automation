# MISSION.md — Autonomous AI Company Architecture

> Goal: $10M software business via client work + own products (PMS, FlashInference)
> Last updated: 2026-02-23

---

## 🏢 Company Hierarchy

### Level 1 — Supreme Command
| Agent | Role | Model |
|-------|------|-------|
| **nabil** | Supreme Commander · HITL Gateway · $10M Roadmap | opus-4-6 |

### Level 2 — Squad Leadership
| Agent | Role | Model |
|-------|------|-------|
| **omar** | CTO / Engineering Lead · Technical Architect | opus-4-6 |
| **karim** | CMO / Marketing Lead · Growth & Revenue Pipeline | opus-4-6 |

### Level 3 — Engineering Squad (7 specialists)
| Agent | Role | Model |
|-------|------|-------|
| **mostafa** | Tech Lead · Architecture, PR Reviews, Docs | sonnet-4-6 |
| **sara** | Senior Frontend · Next.js · Lighthouse Perf | sonnet-4-6 |
| **ali** | Senior Backend · Supabase · API · DB Security | sonnet-4-6 |
| **yasser** | Full Stack · Client Delivery · Tauri/FlashInference | sonnet-4-6 |
| **hady** | UI/UX Designer · Design Systems · Conversion UI | sonnet-4-6 |
| **farah** | QA Engineer · Chaos Engineering · Production Gatekeeper | sonnet-4-6 |
| **bassem** | DevOps · CI/CD · Hosting · 99.9% Uptime | sonnet-4-6 |

### Level 4 — Marketing & Growth Squad (9 specialists)
| Agent | Role | Model |
|-------|------|-------|
| **sami** | SEO & Content Analyst · Technical SEO · Keyword Dominance | gemini-2.5-flash |
| **maya** | Copywriter · High-Conversion Copy | gemini-2.5-flash |
| **amir** | Growth Strategist · Funnels · Growth Levers | gemini-2.5-flash |
| **rami** | CRO Specialist · Signup & Trial-to-Paid Conversion | gemini-2.5-flash |
| **tarek** | Retention Specialist · Churn Prevention · Referrals | gemini-2.5-flash |
| **mariam** | Email/Lifecycle · Behavioral Triggers · List Building | gemini-2.5-flash |
| **nour** | Social Media Manager · Brand & Portfolio Showcase | gemini-2.5-flash |
| **salma** | Outbound/Sales · 20+ Leads/Week Pipeline | gemini-2.5-flash |
| **ziad** | Intelligence · Competitor Monitoring · Market Opportunities | gemini-2.5-flash |

---

## 🚀 Mission Control — Delegation Chain

```
User
 └─► nabil (Supreme Commander)
       ├─► omar (CTO)
       │     ├─► hady    (Design)
       │     ├─► mostafa (Tech Lead / Docs / Scope)
       │     ├─► ali     (Backend)
       │     ├─► sara    (Frontend)
       │     ├─► yasser  (Full Stack)
       │     ├─► farah   (QA)
       │     └─► bassem  (DevOps)
       └─► karim (CMO)
             ├─► sami    (SEO & Content)
             ├─► maya    (Copy)
             ├─► salma   (Outbound/Sales)
             ├─► nour    (Social Media)
             ├─► ziad    (Intelligence)
             ├─► amir    (Growth)
             ├─► rami    (CRO)
             ├─► tarek   (Retention)
             └─► mariam  (Email/Lifecycle)
```

---

## ⚙️ OpenClaw Configuration

### Sub-agent Spawn Permissions (`openclaw.json`)
- **nabil** → allowAgents: `["omar", "karim"]` · maxSpawnDepth: 3
- **omar** → allowAgents: `["hady", "mostafa", "ali", "sara", "yasser", "farah", "bassem"]` · maxSpawnDepth: 2
- **karim** → allowAgents: `["sami", "maya", "salma", "nour", "ziad", "amir", "rami", "tarek", "mariam"]` · maxSpawnDepth: 2
- **Global defaults** → maxSpawnDepth: 3 · maxConcurrent: 8

### Model Allocation
- Supreme Command (nabil) + Squad Leads (omar, karim) → `anthropic/claude-opus-4-6`
- Engineering specialists (mostafa, sara, ali, yasser, hady, farah, bassem) → `anthropic/claude-sonnet-4-6`
- Marketing specialists (sami, maya, amir, rami, tarek, mariam, nour, salma, ziad) → `google/gemini-2.5-flash`

---

## 🛒 Products

### PMS (Project Management SaaS)
- Live: https://pms-nine-gold.vercel.app
- Backend: Supabase
- Also serves as Mission Control for the agents (dogfooding)

### FlashInference
- Desktop app for local AI inference
- Built with Tauri v2
- Owner: yasser

### Client Work
- High-volume landing pages, websites, SaaS builds
- Revenue: part of $10M roadmap

---

## 📝 Operating Rules

1. **Fares only talks to nabil** — all requests flow through Supreme Command
2. **Nabil is HITL Gateway** — human approval on critical decisions before execution
3. **Agents write reports to files** — e.g. `docs/reports/<agent-name>.md` so results survive session termination
4. **Sub-agents use `sessions_spawn`** — not direct API calls
5. **PMS IS Mission Control** — no separate app, all agent features go into PMS
