# Analysis: Safe Push Readiness for PMS-Automation Changes

## Summary
A safe push workflow is feasible, but current working tree has a **secrets exposure risk** that must be resolved before staging/commit/push.

## What Was Analyzed
- Git remote/branch targeting
- Local vs remote sync state
- Tracked/untracked change inventory
- Sensitive artifact exposure likelihood
- Alignment with PMS constitution and dispatch constraints

## Findings

### 1) Remote/Branch Clarity
- Remote `origin` is configured and points to PMS GitHub repository.
- Target branch is `main`.
- Local `main` and `origin/main` were in sync at scan time (`0/0` ahead/behind).
- **Result:** No ambiguity in branch target.

### 2) Secret/Untrusted File Risk
- `e2e/.auth/user.json` is modified and contains authentication token data (session-bearing cookie payload).
- Multiple untracked artifacts exist that look tool-generated or ad hoc (`.codex/`, `.tmp-codex-schema/`, screenshots, temporary reports).
- **Result:** Escalation condition met: repository has untrusted/secrets risk unless strictly excluded.

### 3) Policy Compliance Fit
- Prior decision requires explicit approval before external action (push is external action).
- "No force push / no rewrite history" is straightforward to enforce with standard push path.
- Constitution’s `main`-first workflow is compatible with this task.

## Recommended Guardrails
1. **Allowlist-only staging** (never `git add .` during this operation).
2. **Hard sensitive gate** before commit and before push.
3. **Mandatory approval packet** immediately before `git push origin main`.
4. **Single push path**: standard push only; block if divergence appears.

## Exact Safe Push Steps (Operator Runbook)
Run inside `C:\Users\Fares\Downloads\PMS`:

```powershell
# 1) Preflight context
git rev-parse --show-toplevel
git branch --show-current
git remote -v
git fetch origin --prune
git rev-list --left-right --count origin/main...main
git status --short

# 2) Risk inventory
git diff --name-only
git ls-files --others --exclude-standard

# 3) Remove sensitive file from scope (if present)
git restore --staged e2e/.auth/user.json 2>$null
git restore e2e/.auth/user.json

# 4) Stage only intended safe files
git add <safe-file-1> <safe-file-2>
git diff --staged --name-only
git diff --staged

# 5) Commit with standard format
git commit -m "chore: <scope> <summary>"
git log -1 --oneline

# 6) Approval gate (human approval required before next command)
# Provide: target origin/main, commit hash/title, staged files, secret exclusion pass, non-force confirmation

# 7) Push after explicit approval
git push origin main

# 8) Verify
git status
git rev-list --left-right --count origin/main...main
```

## Escalation Status
- **Escalate:** Yes (secrets/untrusted-file risk currently present).
- **Escalate:** No for remote/branch ambiguity (target is clear).

## Go/No-Go
- Current state: **NO-GO** until sensitive files are excluded and approval is explicitly granted.
- Post-gate state: **GO** if allowlist staging + approval packet are both complete.
