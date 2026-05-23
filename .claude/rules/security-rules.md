# Security Rules

## Purpose

Codify the non-negotiable security posture of dc-rok. Owned by the `security` agent.

## Trust boundaries

- **Untrusted**: anything from Discord (interactions, message content, attachments, guild metadata), anything from the network, anything from disk.
- **Trusted after validation**: typed domain inputs.
- Validation happens at the boundary, once, before logic.

## Secrets

1. Secrets are read **only** in `src/config/` via a typed schema.
2. No `process.env.X` anywhere else in the codebase.
3. Secrets never appear in logs, errors, replies, embeds, or audit entries.
4. `.env` is gitignored. `.env.example` lists every key with placeholder values.
5. Secret rotation procedure documented in `../workflows/release-process.md`.

## Discord intents

- Start with `Guilds` and `GuildMembers` (the latter only if needed for linking).
- `MessageContent` is **forbidden** without an ADR.
- Application commands only. No message-based command parsing.

## Licenses

- License keys are treated as secrets in transit and at rest.
- Comparisons use constant-time equality.
- License keys are hashed at rest where the use case allows (i.e., the bot needs to verify, not display).
- License creation is logged in audit; license values are not.

## Auth & permissions

- Discord permissions are checked at the handler boundary, before delegating to the use-case.
- Admin commands gated by an explicit allow-list, not by guild owner heuristics.
- A user can never operate on another user's license unless they have an explicit admin grant.

## Audit

1. Every state change in license or account-link emits an audit entry.
2. Audit entries are append-only at the DB level (no `UPDATE`/`DELETE` permitted).
3. Audit entries include: actor (Discord user id), action, target, timestamp (UTC), correlation id, metadata (no secrets).
4. Audit reads are gated like admin commands.

## Logging & telemetry

- No PII in standard logs. (Discord user id is a stable identifier and is allowed when needed.)
- No license keys, tokens, or session ids in logs.
- Correlation id on every log line that participates in a request flow.

## Dependencies

- Lockfile committed.
- `npm audit` runs in CI. High/critical = blocking.
- New dependencies require an ADR if they handle secrets, crypto, network, or system calls.

## Rate limiting

- User-triggered flows that touch DB or external services must consider per-user rate limits.
- Discord's own rate limits are honored by the client library; do not add tight retry loops.

## Forbidden

- String-concatenated SQL.
- Logging full interaction payloads.
- Returning license keys to channels (only the issuing user, ephemerally, and only at creation).
- Storing tokens or secrets in the database in plain text.
- Bypassing audit "to keep things simple".

## Enforcement

- Lint rule disallowing `process.env` outside `src/config/`.
- Code review by `security` agent on every PR touching `license`, `auth`, `audit`, `config`, or `dependencies`.
- Security review (`/security-review`) before each release.
