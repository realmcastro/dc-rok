# Release Process

A release is a tagged, deployable state of `main` that has passed all gates.

## Cadence

- No fixed cadence in Phase 1.
- Cut a release when a Phase-1 outcome (`../context/project-vision.md` "Definition of Phase 1 done") becomes demonstrable.

## Pre-release checklist

- [ ] `main` is green in CI.
- [ ] All open PRs targeting this release are merged or deferred.
- [ ] `npm run check` is green on a fresh checkout.
- [ ] `prisma migrate deploy --preview-feature` (dry-run against a staging-shape DB) applies cleanly.
- [ ] Security review (`/security-review`) executed and findings addressed.
- [ ] `../memory/changelog-ai.md` updated with notable AI-driven changes.
- [ ] `CHANGELOG.md` (human-readable) updated for the release tag.
- [ ] Secrets rotated if any have hit their rotation interval.

## Tagging

- Semantic versioning. Phase 1 starts at `0.1.0`; reaches `1.0.0` only when Phase 1 ships fully.
- Tag is annotated and signed: `git tag -s vX.Y.Z -m "..."`.

## Deploy steps

1. Snapshot the DB (production backup verified).
2. Deploy code.
3. Run `npx prisma migrate deploy` as a release step.
4. Health check the bot: it reconnects to Discord, registers commands, replies to a known test command in a known test channel.
5. Tail logs for 10 minutes. Look for unexpected `warn`/`error`.

## Rollback

- If a deploy fails health check, roll back to the previous tag.
- If a migration partially applied, follow its documented forward-fix plan.
- Never run a backwards migration in production unless the original migration's plan said so.

## Secret rotation

- Bot token, DB password, admin allow-list secrets: rotated on a documented interval.
- Rotation is a separate, single-purpose PR.
- Old secrets are revoked immediately after the new ones are confirmed working.

## Post-release

- [ ] Verify the audit table received the deploy event (if instrumented).
- [ ] Update `../memory/decisions-log.md` with any deploy-time decisions.
- [ ] Close the milestone if all its issues are resolved.

## Forbidden

- "Hotfix" deploys that skip `main` and CI. Every deploy goes through `main`.
- Disabling tests "just for this release".
- Force-pushing a tag.
