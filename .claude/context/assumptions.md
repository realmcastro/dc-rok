# Assumptions

Explicit statements of "things we are assuming to be true". When an assumption is violated, the relevant code needs to change — and an ADR is written.

## Runtime & deployment

- Node.js LTS (current stable LTS at project start). Pinned in `.nvmrc`.
- Single-process bot. Horizontal scaling is out of scope for Phase 1.
- Deployed as a long-running process. Restarts are graceful but rare.
- One PostgreSQL instance. No read replicas in Phase 1.

## Discord

- The bot is installed in a known set of guilds. Cross-guild discovery is not needed.
- We can use Discord application commands; we do not need legacy message commands.
- The `MessageContent` privileged intent is **not** required.
- Discord rate limits are sufficient for the expected interaction volume (low hundreds/minute).
- Discord IDs are stable and never reused.

## Users

- One Discord user maps to at most one internal user.
- A user has at most one active license at a time.
- Admin permissions are managed through an allow-list of Discord user IDs, not Discord roles. This is intentionally rigid for Phase 1.

## Licenses

- License keys are issued by an admin command and stored hashed.
- A license has a single owner once activated.
- A license is not transferable in Phase 1 (deactivate + issue a new one).
- Expiry is computed at write time and re-checked on every status read.

## Data

- Active dataset is small (< 100k licenses, < 1M audit events) for the duration of Phase 1. Index strategies assume this scale; we will revisit if volumes grow.
- Backups are out of scope of this repo; deployment infra handles them.

## Security model

- The Discord bot token is the most sensitive secret. Database credentials are next.
- An attacker compromising a single Discord user can affect only that user's license.
- Admin compromise is treated as a higher-tier incident; the audit log is the post-hoc forensic surface.

## Time

- All timestamps stored as `timestamptz`, UTC.
- The `Clock` is injected through `src/shared/`. Tests use a fixed clock.

## What is NOT assumed (and therefore must be handled)

- That Discord is always reachable.
- That the database is always reachable.
- That a user activates only one license in their lifetime.
- That Phase 2 will look exactly like the current sketch.

When an assumption above turns out to be wrong, write an ADR superseding it.
