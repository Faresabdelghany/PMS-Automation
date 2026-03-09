# Testing Agent — Memory

## Past Bug Reports
- (Logged per feature)

## Common Failure Patterns
- (Updated as patterns emerge)

## Testing Strategies
- Unit tests for business logic
- Integration tests for API routes and server actions
- E2E tests with Playwright for user-facing flows
- Always test: empty states, loading states, error states, auth boundaries

## Test Coverage History
- (Tracked per feature)

## Playwright Test Templates
- Use role/label/text selectors, never implementation-detail selectors
- Keep tests isolated and deterministic
- Avoid third-party dependency assertions
- Include screenshots for visual verification
- Max 10 bugs per cycle before escalation

## Tools Reference
- Playwright MCP for writing + running tests
- GitHub MCP for CI logs and PR comments
- Supabase MCP for data-layer verification
