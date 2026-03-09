# Spec: Safe Push of PMS-Automation Local Changes to GitHub

## Feature
Push PMS-Automation local changes to GitHub safely, without leaking secrets, rewriting history, or triggering unintended deployment side effects.

## Problem Statement
Local changes exist in the PMS repo and need to be published to GitHub. Current working tree includes at least one tracked auth artifact (`e2e/.auth/user.json`) and many untracked tool-generated files. A direct `git add . && git push` path is unsafe.

## Context & Constraints
- Prior decision: external actions must be explicitly approved before execution.
- Hard constraints:
  - Do **not** push secrets or env files.
  - Do **not** force push or rewrite history.
- Repo constitution:
  - Primary branch is `main`; push to `main` triggers deployment.
  - Commit messages must use conventional prefixes (`feat:`, `fix:`, `docs:`, `chore:`, etc.).

## Goals
1. Produce a deterministic preflight sequence that blocks unsafe pushes.
2. Define branch/target strategy aligned with current repo policy.
3. Define commit message format and commit hygiene rules.
4. Enforce an explicit human approval gate before any network push.

## Non-Goals
- No code implementation or refactor in this task.
- No actual push execution in this task.
- No history rewrite, squash/rebase policy change, or git flow redesign.

## Current Observations (from repository scan)
- Remote configured: `origin https://github.com/Faresabdelghany/PMS.git`
- Target branch identified: `main`
- Local vs remote `main`: in sync (ahead/behind `0/0` at scan time)
- Risk found: `e2e/.auth/user.json` includes auth token material and must never be committed.
- Noise/untrusted artifacts found: `.codex/`, `.tmp-codex-schema/`, screenshots, and ad-hoc report assets.

## Functional Requirements

### FR-1: Preflight Safety Checks
Before staging any file, operator must run checks:
1. Confirm repo and branch context.
2. List tracked and untracked changes.
3. Detect sensitive files/patterns (`.env*`, auth/session JSON, keys, tokens, credentials).
4. Verify remote and ahead/behind state.
5. Build an explicit allowlist of files intended for commit.

### FR-2: Staging Policy (Allowlist-Only)
- Staging must use file-by-file allowlist (`git add <path>`), never broad globs (`git add .`, `git add -A`) until safety is established.
- Any sensitive file detected must be unstaged or reverted prior to commit.

### FR-3: Branch Strategy
- Default target: `origin/main` (per constitution).
- Push permitted only if:
  - local `main` is not behind remote,
  - no unresolved conflicts,
  - no sensitive artifacts in staged diff.
- If branch diverges or risk remains unresolved, halt and escalate for direction before pushing.

### FR-4: Commit Message Format
Commit title format:
`<type>: <scope> <summary>`

Examples:
- `chore: repo hygiene before push`
- `fix: e2e remove tracked auth state from commit`
- `docs: add automation report artifacts`

Rules:
- Type required (`feat|fix|docs|chore|refactor|test|ci`).
- Imperative mood.
- Keep subject concise and specific.

### FR-5: Approval Gate
- After preflight and before `git push`, present a push summary for explicit approval.
- Summary must include:
  - target remote/branch,
  - commit hash + title,
  - exact staged file list,
  - confirmation that sensitive files are excluded,
  - statement that push is non-force.
- Without explicit approval, stop.

## Acceptance Criteria
1. A repeatable safe-push checklist exists with concrete commands.
2. Sensitive file risk is explicitly handled and documented.
3. Branch/remote target is explicit and validated.
4. Commit message convention is defined.
5. Approval gate is mandatory and placed immediately before push.

## Risks & Escalation Conditions
Escalate immediately if:
1. Repository contains untrusted files/secrets risk that cannot be confidently excluded.
2. Remote/branch target is unclear or diverged in a way requiring policy decision.
3. Push would include deployment-impacting changes not represented in approval summary.

## Definition of Done
- `spec.md`, `plan.md`, `tasks.md`, and `analysis.md` produced.
- Report includes exact safe push steps and command sequence.
- No network push performed by this task.
