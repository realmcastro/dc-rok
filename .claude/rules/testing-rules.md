# Testing Rules

## Purpose

Define test scope, structure, and quality bar. Owned by the `testing` agent.

## Test pyramid

| Layer | What it covers | Tooling | Speed budget |
|-------|----------------|---------|--------------|
| **Unit** | Pure domain logic | vitest/jest, no I/O, no mocks | < 1ms each |
| **Integration** | Application use-cases with real adapters (in-memory or test DB) | vitest + test container or local DB | < 100ms each |
| **Discord handler** | Parser + handler wiring around a fake use-case | vitest + interaction fixture | < 50ms each |
| **End-to-end** | A single happy path: bot replies correctly to a real-looking interaction | vitest + bot test harness | < 5s each |

The pyramid is wide at the bottom: lots of unit tests, fewer integration, very few E2E.

## File layout

- Co-locate: `foo.ts` ↔ `foo.test.ts`.
- Integration tests: `*.int.test.ts`.
- E2E: `tests/e2e/*.e2e.test.ts`.

## Naming

- `describe('LicenseActivation')` matches the unit under test.
- `it('rejects activation when license is already expired')` reads like a sentence.

## Determinism

1. No `Date.now()` in tests. Inject a `Clock` and use a fixed time.
2. No `Math.random()` in tests. Inject an `IdGenerator`.
3. No network. Use in-memory adapters.
4. No `sleep`. Use fake timers.

## Mocks

- Allowed only for things the project does not own: Discord API, third-party SDKs.
- Forbidden for the use-case under test or its domain.
- Prefer in-memory implementations of ports over mocking libraries.

## Bug fix discipline

Every bug fix lands in two commits or one squash with two clear sections:

1. A failing test that reproduces the bug.
2. The fix that makes it pass.

Cherry-picking the fix without the test is rejected.

## Skipping & flakiness

- `.skip` requires a linked issue and a removal date in the comment.
- A flaky test is treated as a failing test. Fix or delete; never quarantine indefinitely.

## Coverage

- Coverage is a heuristic, not a gate. We do not chase numbers.
- The `testing` agent reviews whether the **right** things are tested, not how many lines.

## CI

- `npm run check` runs lint, typecheck, unit, integration, and a smoke E2E.
- Full E2E suite runs on PRs touching `discord/` or `bootstrap/`.

## Forbidden

- Snapshot tests against volatile output (IDs, timestamps).
- Tests that assert on internal implementation details (private methods).
- Tests that depend on test order.
- Tests that share writable state.

## Enforcement

- `testing` agent reviews every PR.
- CI rejects test files without assertions.
- CI rejects `.skip` without an issue link.
