# Definition of Done

A task is **done** only when **every** box below is true. Partially done is not done.

## Functional

- [ ] The change behaves as the PR description says, verified manually.
- [ ] Edge cases listed in the spec are handled with explicit code paths.
- [ ] User-facing errors map to friendly embeds with a correlation id.

## Code quality

- [ ] Follows `../rules/coding-rules.md` and `../rules/naming-rules.md`.
- [ ] No `any`, no unjustified `as`, no `process.env` outside `src/config/`.
- [ ] No `console.*` outside `bootstrap/`.
- [ ] Functions and files are sized to their responsibility (no fat services).

## Architecture

- [ ] Dependency direction respected.
- [ ] Cross-module access through application ports.
- [ ] No Phase-2 capability introduced.

## Tests

- [ ] Unit tests cover the new domain rules.
- [ ] Integration tests cover the new use-cases.
- [ ] Slash command handler tests exist where applicable.
- [ ] Bug fix: a regression test exists.
- [ ] `npm run check` is green locally and in CI.

## Database

- [ ] Schema changes have migrations checked in.
- [ ] Migrations apply cleanly from scratch.
- [ ] Required indexes added.
- [ ] Backfill (if any) is idempotent.

## Security

- [ ] Inputs validated by Zod at the boundary.
- [ ] Audit entry written for every state change.
- [ ] No secret in logs, replies, or audit payloads.
- [ ] Admin commands gated and tested.

## Observability

- [ ] Correlation id present on every log line in the new code paths.
- [ ] Outbound calls log `op`, `target`, `durationMs`, `ok`.
- [ ] Failure paths log with stack at `error`, with context at `warn` when recovered.

## Discord UX

- [ ] Sensitive replies are `ephemeral: true`.
- [ ] Long operations use `deferReply`.
- [ ] Embeds rendered locally and visually inspected.

## Documentation & governance

- [ ] PR description names the Phase-1 outcome.
- [ ] `README.md` scripts/env updated if necessary.
- [ ] `.env.example` updated if env vars added.
- [ ] ADR added if a decision was made.
- [ ] `../context/future-roadmap.md` updated for any deferred work.

## Hand-off

- [ ] Self-review done.
- [ ] Required specialist agents have approved.
- [ ] No "TODO" left in the diff without an owner and an issue link.

If any box is unchecked, the work is **not** done.
