# ⛔ MANDATORY EXECUTION PROTOCOL — BLOCKS YOUR FINAL REPLY

You MUST follow this exact sequence. Skipping any step = task NOT DONE.

---

## Step 1: Create your execution run (FIRST THING YOU DO)

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\create-agent-run.ps1" -AgentName "AGENT_NAME" -TodoId "TODO_ID" -ModelUsed "MODEL" -TriggeredBy "system" -ExecutionMode "auto" -InputSummary "TASK_SUMMARY"
```
Save the returned **RunId** — you need it for all subsequent calls.

## Step 2: Emit task_started event

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\emit-task-event.ps1" -TodoId "TODO_ID" -EventType "task_started" -ActorType "agent" -ActorName "AGENT_NAME" -Summary "Starting: TASK_SUMMARY" -RunId "RUN_ID"
```

## Step 3: Do your actual work

Complete the task as specified.

## Step 4: Update the todo status

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\update-todo.ps1" -TodoId "TODO_ID" -Status "in_progress" -WorkflowStage "PA|DEV|TEST|REVIEW|SPECIALIST" -UpdatedByAgent "AGENT_NAME" -LastUpdateSummary "WHAT_YOU_DID" -SetLastEventAt
```
If task is fully done (no more pipeline steps): use `-Status "done" -SetCompletedAt`
If task failed: use `-Status "todo" -SetFailedAt`

## Step 5: Complete the agent run

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\update-agent-run.ps1" -RunId "RUN_ID" -Status "completed" -OutputSummary "RESULT_SUMMARY"
```
If failed: use `-Status "failed" -ErrorMessage "WHAT_WENT_WRONG"`

## Step 6: Emit completion event

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\emit-task-event.ps1" -TodoId "TODO_ID" -EventType "task_completed" -ActorType "agent" -ActorName "AGENT_NAME" -Summary "Completed: RESULT_SUMMARY" -RunId "RUN_ID"
```
If failed: use `-EventType "task_failed"`

## Step 7: Post handoff comment

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\add-comment.ps1" -TodoId "TODO_ID" -Author "AGENT_NAME" -Html "SUMMARY_OF_WORK. @NEXT_AGENT please continue."
```
Pipeline order: Product Analyst → Dev → Testing Agent → Code Reviewer → Ziko

## Step 8: Log to agent_logs (THE GATE)

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\Fares\.openclaw\workspace\scripts\log-agent-task.ps1" -AgentName "AGENT_NAME" -TaskDescription "SUMMARY" -ModelUsed "MODEL" -Status "completed" -TodoId "TODO_ID" -RunId "RUN_ID"
```
Verify the output says "Logged: ..."
If it fails, retry once. If still failing, use `-Status "failed"`.

## Step 9: ONLY NOW send your final reply

---

**Replacements:**
- AGENT_NAME → your exact agent name (Ziko, Product Analyst, Dev, Testing Agent, Code Reviewer, Designer, Marketing Agent, Job Search Agent)
- TODO_ID → the task's `todos.id` (REQUIRED)
- RUN_ID → the id returned from Step 1
- MODEL → the model you're running on
- TASK_SUMMARY / RESULT_SUMMARY → one-line descriptions
- NEXT_AGENT → the next agent in the pipeline

**If you skip ANY step, your work is considered NOT DONE. This is the highest priority rule.**
