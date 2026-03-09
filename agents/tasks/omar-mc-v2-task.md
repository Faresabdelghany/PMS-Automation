# Omar Task — Mission Control v2

You are Omar, Tech Lead. Read CLAUDE.md FIRST: C:\Users\Fares\Downloads\PMS\CLAUDE.md
Read your prompt: C:\Users\Fares\.openclaw\workspace\agents\prompts\omar.md

Working directory: C:\Users\Fares\Downloads\PMS

## Sprint Goal
Add the missing infrastructure that turns PMS into a real Mission Control.

---

## PART 1 — Spawn Mostafa for DB migrations

Spawn Mostafa with this task:

You are Mostafa, Backend engineer. Working dir: C:\Users\Fares\Downloads\PMS
Read CLAUDE.md first.

### Migration 1 — Extend agents table
```sql
ALTER TABLE agents ADD COLUMN IF NOT EXISTS session_key TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS current_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
```

### Migration 2 — Messages table (agent-to-agent comments on tasks)
```sql
CREATE TABLE IF NOT EXISTS task_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  from_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE task_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "task_messages_org" ON task_messages FOR ALL USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
ALTER PUBLICATION supabase_realtime ADD TABLE task_messages;
```

### Migration 3 — Documents table (agent deliverables)
```sql
CREATE TABLE IF NOT EXISTS agent_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  doc_type TEXT DEFAULT 'deliverable' CHECK (doc_type IN ('deliverable', 'research', 'protocol', 'draft', 'report')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE agent_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_documents_org" ON agent_documents FOR ALL USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
ALTER PUBLICATION supabase_realtime ADD TABLE agent_documents;
```

### Migration 4 — Notifications table (@mentions)
```sql
CREATE TABLE IF NOT EXISTS agent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mentioned_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  message_id UUID REFERENCES task_messages(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  delivered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE agent_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_notifications_org" ON agent_notifications FOR ALL USING (
  organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
ALTER PUBLICATION supabase_realtime ADD TABLE agent_notifications;
```

### Migration 5 — Seed session_key for all 24 agents
Update the agents table with session keys for all agents in org 9c52b861-abb7-4774-9b5b-3fa55c8392cb.
Pattern: agent:<slug>:main where slug is the agent's role in lowercase with hyphens.

Write the SQL as:
UPDATE agents SET session_key = 'agent:main:main' WHERE name = 'Ziko' AND organization_id = '9c52b861-abb7-4774-9b5b-3fa55c8392cb';
(repeat for all 24 agents)

Full list:
- Ziko → agent:main:main
- Nabil → agent:nabil:main
- Omar → agent:tech-lead:main
- Karim → agent:marketing-lead:main
- Design Lead → agent:design-lead:main
- Product Analyst → agent:product-analyst:main
- Researcher → agent:researcher:main
- Sara → agent:frontend:main
- Mostafa → agent:backend:main
- Ali → agent:backend-senior:main
- Yasser → agent:fullstack:main
- Hady → agent:qa:main
- Farah → agent:ui-designer:main
- Bassem → agent:devops:main
- Design Agent → agent:design-agent:main
- Sami → agent:seo:main
- Maya → agent:content:main
- Amir → agent:social:main
- Rami → agent:outreach:main
- Tarek → agent:cro:main
- Mariam → agent:ads:main
- Nour → agent:email-marketing:main
- Salma → agent:copywriter:main
- Ziad → agent:analytics:main

### Output
Write ALL migrations to a SINGLE file:
C:\Users\Fares\Downloads\PMS\supabase\migrations\20260224000001_mission_control_v2.sql

Also write the server actions for the new tables:
- C:\Users\Fares\Downloads\PMS\lib\actions\task-messages.ts (createMessage, getMessages, createNotification)
- C:\Users\Fares\Downloads\PMS\lib\actions\agent-documents.ts (createDocument, getDocuments, getDocument)

Follow existing patterns from lib\actions\agents.ts exactly.
Use requireAuth() for auth. Use invalidateCache where applicable.
New table names not in generated types — use `as any` + cast pattern.

Run pnpm.cmd build — fix ALL TypeScript errors.
Write report to docs/reports/mostafa-mc-v2.md
Then spawn Omar back:
  task: "You are Omar. Mostafa finished MC v2 migrations. Report: docs/reports/mostafa-mc-v2.md. Review then spawn Sara."
  mode: run
  label: omar-after-mostafa-mcv2

---

## PART 2 — After Mostafa, spawn Sara for frontend

Spawn Sara with this task:

You are Sara, Senior Frontend Developer. Working dir: C:\Users\Fares\Downloads\PMS
Read CLAUDE.md first. Read docs/design-system.json. Read docs/design_concept.json.
Read components/tasks/TaskDetailPanel.tsx (gold standard for panels).

## Sara's Task
Add Mission Control v2 UI features to PMS.

### Feature 1 — Show session_key on agent cards and detail panel
In components/agents/AgentDetailPanel.tsx:
- Add a read-only "Session Key" field showing agent.session_key
- Style as monospace text (font-mono text-sm text-muted-foreground)
- Label: "OpenClaw Session"
- Show copy-to-clipboard button next to it

In the agents table (components/agents/agents-table.tsx or wherever the table is):
- Add a small badge or pill showing session_key (truncated: agent:omar:main → shown as-is if short enough)

### Feature 2 — Show "Currently Working On" on agent cards  
In the agents list/table:
- If agent.current_task_id is set, show a small indicator "Working on: [task title]"
- Fetch task title via join or separate lookup
- Use a pulsing green dot to indicate active

### Feature 3 — Task Messages panel (agent-to-agent comments)
Create: components/tasks/TaskMessagesPanel.tsx
- Shows all messages for a task (from task_messages table)
- Each message: agent avatar (initials), agent name, content, time ago
- "Add comment" textarea at bottom (for Fares to comment)
- Realtime updates via usePooledRealtime hook (check existing hooks)
- Empty state: "No messages yet. Agents will discuss this task here."
- Mount this panel in the task detail view alongside existing comments

### Feature 4 — Documents panel on tasks
Create: components/tasks/TaskDocumentsPanel.tsx  
- Lists agent_documents attached to a task
- Each document: icon by doc_type, title, agent name, created date, "View" button
- "View" opens a Sheet with full document content (markdown rendered)
- Empty state: "No deliverables yet."
- Mount alongside TaskMessagesPanel in task detail

Run pnpm.cmd build — 0 TypeScript errors.
Write report to docs/reports/sara-mc-v2.md
Then spawn Omar back:
  task: "You are Omar. Sara finished MC v2 frontend. Report: docs/reports/sara-mc-v2.md. Spawn Hady for QA."
  mode: run
  label: omar-after-sara-mcv2

---

## PART 3 — After Sara, spawn Hady for QA

Standard QA pass. Verdict PASS/FAIL with file/line.
If PASS: git add -A && git commit -m "feat: mission control v2 - session keys, messages, documents, notifications" && git push
Then spawn Product Analyst back with your sign-off:
  task: "You are Product Analyst. Omar's squad finished MC v2. Hady QA PASSED. Ready for final report."
  mode: run
  label: product-analyst-after-omar-mcv2
