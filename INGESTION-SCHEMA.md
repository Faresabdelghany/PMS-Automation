# SpecKit Decomposition Ingestion Payload Schema

## Ingestion Script
`ingest-speckit-decomposition.ps1`

## Input Format (JSON array of task objects)

### Required fields (from PA SpecKit output)
- `title` (string, non-empty) — task name
- `description` (string) — what to implement
- `acceptance_criteria` (string) — pass/fail rules

### Optional fields (PA may provide, importer auto-fills if missing)
- `priority` (string: Low|Medium|High|Critical) — default: Medium
- `category` (string) — default: Work

### Auto-filled by importer (non-negotiable, cannot override)
- `parent_task_id` — set by caller (ParentTodoId parameter)
- `source` — always `speckit`
- `order_index` — auto-numbered 1,2,3... (order in JSON array)
- `lifecycle_status` — first task `ready`, rest `queued`
- `assignee` — always `Dev` (unless caller overrides Assignee param)
- `status` — always `todo` (for all child tasks)
- `task_type` — always `agent_task`
- `workflow_stage` — always `DEV`
- `created_by_user` — always `Fares`
- `created_by_agent` — caller provides (default: Product Analyst)

### Defaults applied
- `priority` = Medium (if not provided)
- `category` = Work (if not provided)

### Idempotency
- Unique constraint: `(parent_task_id, order_index, source='speckit')`
- Re-running with same JSON → updates existing rows, no duplicates
- Safe to re-run if PA refines decomposition

## Payload Example (JSON array)
```json
[
  {
    "title": "Build API endpoint",
    "description": "Implement POST /api/items with validation",
    "acceptance_criteria": "Returns 201 on success, 400 on invalid input",
    "priority": "High",
    "category": "Backend"
  },
  {
    "title": "Add UI form",
    "description": "Create React component for item submission",
    "acceptance_criteria": "Form submits data, shows success message"
  }
]
```

## Category handling
- If `category` provided: use it
- If missing: default to `Work`
- No validation on category values (flexible)

## Priority handling
- If `priority` provided: must be one of (Low|Medium|High|Critical)
- If missing: default to `Medium`
- Enforced via check constraint in DB

## Rerun behavior
Caller invokes:
```powershell
ingest-speckit-decomposition.ps1 -ParentTodoId <id> -TasksJsonPath <path>
```

Script checks:
1. For each task by `(parent_task_id, order_index)`:
   - If exists: UPDATE (upsert)
   - If new: INSERT
2. Idempotent: running twice with same JSON produces same queue state

## What PA must provide (minimum)
- title (non-empty)
- description
- acceptance_criteria

## What importer guarantees
- Correct parent linkage
- Correct ordering
- First task always ready
- All others queued
- All assigned to Dev
- Event/log written for import step
