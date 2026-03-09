# Tasks: Safe Push of PMS Changes to GitHub

## Objective
Prepare and execute a safe, approved push of PMS local changes to `origin/main` without leaking secrets or rewriting history.

## Task Checklist

### T1 — Verify Repository Context
- [ ] `git rev-parse --show-toplevel` equals `C:/Users/Fares/Downloads/PMS`
- [ ] `git branch --show-current` confirmed
- [ ] `git remote -v` confirms `origin` target

### T2 — Sync and Compare with Remote
- [ ] `git fetch origin --prune`
- [ ] `git rev-list --left-right --count origin/main...main`
- [ ] Record ahead/behind result in approval packet

### T3 — Inventory Local Changes
- [ ] `git status --short`
- [ ] `git diff --name-only`
- [ ] `git ls-files --others --exclude-standard`

### T4 — Run Sensitive File Gate
- [ ] Check for `.env*`, `e2e/.auth/*`, tokens, keys, auth dumps
- [ ] If found in tracked changes, remove from commit scope (`git restore` / `git restore --staged`)
- [ ] Confirm sensitive exclusion = PASS

### T5 — Define Commit Scope (Allowlist)
- [ ] Build explicit safe file allowlist
- [ ] Stage only allowlisted files via `git add <paths>`
- [ ] Verify staged files with `git diff --staged --name-only`
- [ ] Review diff with `git diff --staged`

### T6 — Create Commit
- [ ] Use conventional commit format `<type>: <scope> <summary>`
- [ ] `git commit -m "..."`
- [ ] Capture `git log -1 --oneline`

### T7 — Approval Gate (Hard Stop)
- [ ] Prepare approval packet:
  - Target remote/branch
  - Commit hash + subject
  - Exact staged file list
  - Sensitive exclusion confirmation
  - Confirmation of non-force push
- [ ] Obtain explicit approval to push

### T8 — Push and Verify (After Approval Only)
- [ ] `git push origin main`
- [ ] Validate clean/synced state:
  - `git status`
  - `git rev-list --left-right --count origin/main...main`

## Current Risk Notes (from scan)
- [ ] **Open risk:** `e2e/.auth/user.json` contains auth token state; must not be committed.
- [ ] **Open risk:** local tool artifacts (`.codex/`, `.tmp-codex-schema/`, screenshots) may be accidental.

## Exit Criteria
- Push happens only after explicit approval and sensitive exclusion pass.
- No force push, no history rewriting, no secret leakage.
