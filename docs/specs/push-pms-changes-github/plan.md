# Plan: Safe Push Workflow for PMS-Automation Changes

## Technical Approach
Implement an operator-driven, command-based safe push pipeline with hard stop gates:
1. **Preflight context validation**
2. **Sensitive-file screening**
3. **Allowlist staging + commit**
4. **Approval gate**
5. **Controlled push to origin/main**

No force operations, no history rewrite.

## Phase 1 — Preflight Validation
Run from `C:\Users\Fares\Downloads\PMS`.

```powershell
git rev-parse --show-toplevel
git branch --show-current
git remote -v
git fetch origin --prune
git rev-list --left-right --count origin/main...main
git status --short
```

Expected pass:
- Correct repo root.
- Branch is `main` unless explicitly approved otherwise.
- Remote `origin` points to PMS GitHub.
- Ahead/behind understandable and acceptable.

## Phase 2 — Secret/Untrusted Artifact Screening

```powershell
git diff --name-only
git ls-files --others --exclude-standard
```

Manual blocklist review for files like:
- `.env`, `.env.*`
- `e2e/.auth/*`
- auth/session/token dumps
- private keys/certs
- tool temp directories (`.tmp-*`, `.codex/`) unless intentionally versioned

If a sensitive tracked file is modified, remove from commit scope:

```powershell
git restore --staged <path>  # if staged
git restore <path>           # discard local changes if needed
```

## Phase 3 — Commit Construction (Allowlist Only)
Stage only known-safe files:

```powershell
git add <safe-file-1> <safe-file-2> ...
git diff --staged --name-only
git diff --staged
```

Commit:

```powershell
git commit -m "<type>: <scope> <summary>"
```

## Phase 4 — Approval Gate (Mandatory)
Prepare this approval packet before push:

```text
Target: origin/main
Commit: <short_sha> <subject>
Staged Files: <exact list>
Sensitive Exclusion Check: PASS/FAIL (+ notes)
Push Mode: standard push (no --force)
```

If explicit approval is not granted: stop.

## Phase 5 — Push Execution (Only after approval)

```powershell
git push origin main
```

Post-push validation:

```powershell
git status
git log -1 --oneline
git rev-list --left-right --count origin/main...main
```

## Branch Strategy
- Primary strategy: push directly to `origin/main` (constitution-aligned).
- Fallback (escalation): if divergence or risk ambiguity appears, stop and request decision (e.g., temporary review branch) before any push.

## Commit Message Standard
- Required format: `<type>: <scope> <summary>`
- Allowed types: `feat|fix|docs|chore|refactor|test|ci`
- Examples:
  - `chore: cleanup local automation artifacts`
  - `docs: add PMS automation execution report`

## Decision Log
- External actions require explicit approval before execution.
- No force push; no history rewrite.
- Sensitive files must be excluded by default unless explicitly intended and safe.
