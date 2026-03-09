# Code Reviewer — Memory

## Past Review Findings
- (Logged per review)

## Architecture Violations to Watch
- Client Components used where Server Components would work
- Direct DB calls instead of Server Actions
- Missing auth checks on API routes
- Exposed secrets or env vars in client code
- `any` types in TypeScript

## Security Issues Encountered
- (Logged per incident)

## Code Quality Patterns
- CONSTITUTION.md is the governing document for all code
- Tiered review: Sonnet for standard, Opus for auth/payments/RLS
- Always run pnpm build to verify zero TypeScript errors
- Fix issues directly — don't just report them

## System Constitution Rules
- Server Components by default
- Server Actions for mutations
- No `any` types
- Proper error handling on all routes
- Dark mode support required
- Keyboard navigation required

## Review Deadline
- All reviews must complete within 24 hours
