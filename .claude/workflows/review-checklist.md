# Review Checklist

Every PR is reviewed against this list. Items unticked at merge time are merge blockers.

## Scope

- [ ] PR description names the Phase-1 outcome it serves.
- [ ] PR scope matches the description. No surprise changes.
- [ ] No out-of-scope work (`scope-enforcer`).

## Architecture

- [ ] Dependency direction respected (`architecture-rules.md`).
- [ ] No new circular imports.
- [ ] No business logic in `src/discord/`.
- [ ] No `src/utils/` or `src/lib/` catch-all additions.
- [ ] Cross-module access goes through application ports.

## Code

- [ ] `npm run check` is green.
- [ ] No `any`. No `as` at I/O boundaries.
- [ ] Errors are typed and logged with context.
- [ ] No `console.*` outside `bootstrap/`.
- [ ] No `process.env` outside `src/config/`.
- [ ] Async paths have timeouts where they hit I/O.
- [ ] Naming follows `naming-rules.md`.

## Tests

- [ ] New domain rules have unit tests.
- [ ] New use-cases have integration tests.
- [ ] New slash commands have a handler test.
- [ ] Bug fixes include a regression test.
- [ ] Tests are deterministic (no `Date.now`, no `Math.random`, no network, no sleep).

## Database

- [ ] Schema changes follow `database-change-process.md`.
- [ ] Migration applies cleanly from scratch.
- [ ] Indexes match new query patterns.
- [ ] No destructive change in the same release as the code stopping use.

## Security

- [ ] Inputs validated via Zod at the boundary.
- [ ] Audit entries written for state changes.
- [ ] No secret in logs, replies, or audit payloads.
- [ ] Admin commands gated by allow-list and tested.
- [ ] No new dependency handles secrets/crypto/network without an ADR.

## Discord

- [ ] Handler ≤ ~50 lines: parse → use-case → present.
- [ ] User-private replies are `ephemeral: true`.
- [ ] Long ops use `deferReply`.
- [ ] Embeds use the shared builder.
- [ ] Command builder declares required Discord permissions.

## Observability

- [ ] New code logs correlation id.
- [ ] Outbound calls log `op`, `target`, `durationMs`, `ok`.
- [ ] No log spam (no per-event `info` in hot loops).

## Governance

- [ ] ADR added or updated if a decision was made.
- [ ] `../rules/` updated if a rule changed.
- [ ] `../context/future-roadmap.md` updated if speculation was deferred.

## Final

- [ ] Self-reviewed.
- [ ] Relevant specialist agent(s) approved.
- [ ] `definition-of-done.md` checked end-to-end.
