# Daily Standup Cron — Tasks

## Product/Spec
- [ ] Confirm recipients (team list or channel ID).
- [ ] Confirm delivery channel (Telegram/Slack/PMS) and thread.
- [ ] Confirm timezone + prompt/cutoff times.
- [ ] Decide response mechanism (thread replies vs form).

## Dev
- [ ] Create config storage (table or config file) with timezone, schedule, channel.
- [ ] Implement scheduled prompt job (idempotent, weekday check).
- [ ] Implement response ingestion (reply handler or form endpoint).
- [ ] Implement scheduled summary job (compile, blockers, missing).
- [ ] Add admin controls: run now / skip today / edit schedule.
- [ ] Add logging & error reporting for each run.

## QA
- [ ] Verify prompt posts at configured time in timezone.
- [ ] Verify summary posts at cutoff time.
- [ ] Verify rerun does not duplicate unless forced.
- [ ] Verify late responses are flagged.

## Review
- [ ] Confirm success metrics and monitoring are in place.
