# Logging Rules

## Purpose

Logs are the project's runtime memory. They must be structured, queryable, and free of noise.

## Library

- One logger module. Pino (or chosen equivalent). Configured in `src/shared/infrastructure/logger.ts`.
- Never `console.*` in `src/` except `bootstrap/` pre-logger startup errors.

## Format

- JSON in production. Pretty (human) in development.
- Every log line has: `level`, `time` (ISO 8601 UTC), `msg`, `op` (operation name), `correlationId`.

## Levels

| Level | When |
|-------|------|
| `fatal` | Process cannot continue. Followed by graceful shutdown. |
| `error` | An operation failed. Recovery is the caller's job. Includes stack. |
| `warn` | Something unexpected but recovered. Worth investigating. |
| `info` | Successful state changes, completed operations, lifecycle events. |
| `debug` | Detail useful when reproducing an issue. Off in production by default. |
| `trace` | Per-event spam. Off by default. |

## Required fields by operation type

- **Discord interaction**: `op`, `commandName`, `guildId`, `userId`, `correlationId`, `outcome`, `durationMs`.
- **DB write**: `op`, `entity`, `entityId`, `correlationId`, `durationMs`.
- **External call**: `op`, `target`, `durationMs`, `ok`, `correlationId`.
- **Audit-relevant** events also write to the audit log (not just the runtime log).

## Forbidden in logs

- Discord bot token, license keys, any secret.
- Full interaction payloads.
- Stack traces in `info` or below.
- PII beyond stable Discord IDs.

## Correlation

- A correlation id is generated at the interaction boundary and propagated through every async call.
- The correlation id is included in user-facing error embeds as a short suffix (e.g., last 6 chars), so a user can quote it back.

## Sampling

- `debug`/`trace` are off by default. Enabled via env vars per module.

## Forbidden patterns

- `log.info('done')` with no structure.
- `log.error(err)` without context.
- `JSON.stringify` in log calls. Pass an object; let the logger serialize.

## Enforcement

- Lint rule disallows `console.*` in `src/` (except `bootstrap/`).
- `backend-reliability` agent reviews logging coverage in PRs touching I/O.
