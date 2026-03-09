# Daily Standup Cron — Plan

## Architecture (Proposed)
- **Scheduler**: Supabase scheduled function or server-side cron (preferred: Supabase Edge Function + cron schedule).
- **Config store**: `standup_config` table or config file with:
  - timezone, prompt_time, cutoff_time, weekdays, channel_type, channel_id, enabled.
- **Standup records**:
  - `standup_runs` (date, status, prompt_sent_at, summary_sent_at, errors)
  - `standup_responses` (run_id, user_id, answers, submitted_at, late)

## Workflow
1. **Prompt job** (scheduled at prompt_time)
   - Load config → check weekday → ensure not already prompted.
   - Post prompt to channel (or send link).
   - Create standup run record.
2. **Collection**
   - Accept responses via channel replies or form endpoint.
   - Normalize into `standup_responses`.
3. **Summary job** (scheduled at cutoff_time)
   - Compile responses for the run.
   - Identify missing responders.
   - Post summary and update run record.
4. **Admin controls**
   - Basic UI or CLI endpoint: run now / skip today / edit schedule.

## Integrations
- **Telegram** (assumed): use existing bot token; post to thread_id with `sendMessage`.
- If Slack or internal PMS channel is required, swap posting adapter without changing core workflow.

## Observability
- Log run status to database.
- Emit errors to a monitoring channel (optional).

## Security & Permissions
- Restrict admin endpoints to internal roles.
- Store tokens/secrets in env.

## Implementation Notes
- Use idempotency key `date + channel_id`.
- When rerun, delete or mark prior prompt if forced.
- Timezone conversion at runtime with a reliable library.

## Risks & Mitigations
- **Missing context on channel/timezone** → use defaults but require config before enabling.
- **Channel reply capture** → if not feasible, start with form-based submission.
