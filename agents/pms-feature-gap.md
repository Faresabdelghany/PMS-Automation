# PMS Feature Gap Analysis — Mission Control Integration

## What PMS Already Has ✅
- Auth (email/password + Google OAuth)
- Multi-tenant organizations with RBAC
- Projects (wizard, scope, outcomes, features, deliverables, metrics, workstreams)
- Tasks (kanban, drag-drop, status, priority, assignments, comments, activities)
- Clients (CRUD, project associations, status tracking)
- Inbox/Notifications
- AI Chat (BYOK — user configures provider + API key + model in settings)
- File uploads + storage
- Notes (general, meeting, audio)
- Rich text editing (Tiptap)
- Charts/Reports (Recharts)
- Real-time updates (Supabase Realtime)
- Light/dark theme
- Search (global)
- Tags + Labels
- Chat/Conversations
- Workflow statuses (customizable)
- Teams
- Invitations
- E2E tests (Playwright)

## What PMS Needs for Mission Control 🔧

### 1. Agent Management (NEW)
- Agents table: id, name, role, type (SUPREME/LEAD/SPC/INT), squad, status, model, system_prompt, capabilities, last_active
- Agent detail page: description, activity log, performance notes, assigned tasks
- Agent card grid view with status indicators
- Assign tasks TO agents (extend task assignee to support agents)
- Agent activity feed (what each agent did)

### 2. AI Model Management (EXTEND existing)
- Current: single user-level AI provider/key/model in settings
- Need: Multiple models configurable per agent
- Models table: id, provider, model_id, display_name, api_key_encrypted, base_url, active, cost_per_token
- Model selector per agent
- Model usage tracking

### 3. Skills System (NEW)
- Skills table: id, name, description, agent_id, skill_type, config
- Assign skills to agents
- Skill library (reusable across agents)

### 4. Revenue Dashboard (NEW)
- Revenue tracking: client invoices, MRR, one-time sales
- Revenue by stream (client work, PMS subscriptions, FlashInference)
- Monthly/quarterly views
- Progress toward $10M goal

### 5. Agent Communication (EXTEND chat)
- Current: AI chat with single LLM
- Need: Agent-to-agent messaging via existing chat system
- Task-level agent discussions
- Squad channels

### 6. Billing/Subscriptions (NEW — for PMS as product)
- Stripe integration
- Pricing tiers
- Usage metering
- Invoice generation

## Priority Order
1. Agent Management — core of Mission Control
2. AI Model Management — agents need different models
3. Revenue Dashboard — track the $10M goal
4. Skills System — organize agent capabilities
5. Agent Communication — extend existing chat
6. Billing — when ready to launch PMS publicly
