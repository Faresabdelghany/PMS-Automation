# Daily Standup Cron — Spec

## Summary
Automate a daily standup prompt and summary workflow. A scheduled job triggers a standup “check‑in” at a consistent local time, gathers updates, and posts a compiled summary to a designated channel.

## Goals
- Ensure the team receives a reliable daily standup prompt on weekdays.
- Capture individual updates in a consistent format.
- Publish a concise summary to the agreed channel within the same workday.
- Provide basic monitoring and a manual override (re-run / skip).

## Non‑Goals
- Building a full standup UI or analytics dashboard.
- AI rewriting or sentiment analysis of updates.
- Multi‑team advanced scheduling in v1.

## Assumptions (to validate)
- Primary recipients: internal PMS team (Agents group).
- Primary channel: Telegram group thread (thread_id=4) or equivalent configured channel.
- Default timezone: Africa/Cairo.
- Default schedule: weekdays at 09:00 local time; summary posted at 11:00.

## User Stories
1. As a team member, I receive a standup prompt at the same time each weekday.
2. As a team lead, I can see a consolidated summary without chasing people.
3. As ops, I can adjust time, recipients, and channel without code changes.

## Functional Requirements
### Scheduling
- Run on weekdays (Mon–Fri) at a configurable time in a configured timezone.
- Support a configurable cutoff time after which late replies are marked late and excluded from the main summary.
- Allow manual “run now” and “skip today.”

### Standup Prompt
- Prompt includes the standard 3 questions:
  - What did you do yesterday?
  - What will you do today?
  - Any blockers?
- Prompt includes a submission link or reply instructions.

### Collection
- Accept responses via:
  - Direct reply in the channel thread, OR
  - Link to a simple form (v1 can be link-only if channel replies aren’t capturable).
- Each response is tied to the date and user.
- Late responses are flagged.

### Summary
- At cutoff time, compile responses into a single post.
- Include list of missing responders.
- Include blockers section (aggregated).

### Observability & Control
- Log each scheduled run (success/failure).
- Simple retry on transient failure (1–3 attempts).
- Admin can view last run status and trigger a rerun.

## Non‑Functional Requirements
- Reliability: 99% of weekdays should send a prompt on time.
- Idempotency: re-running a job should not duplicate prompts unless explicitly forced.
- Timezone correctness including DST changes (if applicable).

## Success Metrics
- ≥95% prompt delivery success rate within 2 minutes of scheduled time.
- ≥80% response rate by cutoff time (initial target).
- Summary posted successfully ≥95% of weekdays.

## Edge Cases
- Timezone changes / DST shifts.
- Network outages or integration downtime.
- Partial responses (missing answers).
- Holidays (optional future enhancement: calendar-based skips).

## Open Questions
- Confirm recipients (team list or channel).
- Confirm channel/integration (Telegram vs Slack vs PMS internal).
- Confirm default time and cutoff time.
- Confirm response mechanism (reply in thread vs form link).
