# Observability Standard

What we log, what we measure, and how we trace work end-to-end.

## Goals

1. Every user-visible failure is traceable to a structured log entry within seconds.
2. Every state change in `license` / `account-link` / `session` has an audit row.
3. Operators can ask "what happened to user X at time T" and answer it from logs + audit.
4. Logs do not leak secrets, license keys, or full payloads.

## Layers

### Runtime logs (Pino)

- Structured JSON in production.
- Pretty in development.
- Levels per `../rules/logging-rules.md`.

### Audit (DB)

- Append-only `audit_logs` table.
- Written from a single `AuditPort` in each module.
- Always paired with a runtime log at `info`.

### Metrics (Phase-1 minimum)

- We do not stand up a metrics stack in Phase 1.
- We **do** log durations for every outbound call and every use-case run, so we can derive metrics from logs if needed.

### Tracing

- A correlation id per interaction, generated at the Discord boundary.
- Propagated through every async call via a `RequestContext`.

## Required log shape

Every log line:

```json
{
  "level": "info",
  "time": "2026-05-23T12:34:56.789Z",
  "op": "session.start",
  "correlationId": "01HW...",
  "accountId": "01HV...",
  "discordUserId": "d-123",
  "outcome": "ok",
  "durationMs": 14,
  "msg": "session activated"
}
```

Forbidden in logs: bot token, license keys, activation codes, raw Discord payloads, stack traces below `error`.

## Required log points

| Point | Level | Fields |
|-------|-------|--------|
| Bot startup | `info` | `version`, `nodeVersion`, `commandCount` |
| Command registration | `info` | `op: 'discord.commands.register'`, `count` |
| Interaction received | `debug` | `op`, `commandName`, `correlationId`, `discordUserId` |
| Interaction handled | `info` | `op`, `commandName`, `outcome`, `durationMs`, `correlationId` |
| Use-case run | `info` (success) / `error` (failure) | `op`, `outcome`, `durationMs`, `correlationId`, domain ids |
| DB write | `debug` | `op`, `entity`, `entityId`, `correlationId`, `durationMs` |
| External call | `info` | `op`, `target`, `durationMs`, `ok`, `correlationId` |
| Shutdown | `info` | reason, drainDurationMs |

## Required audit points

Every transition listed below writes an `audit_logs` row:

- `account.linked`, `account.unlinked`, `account.reset`
- `license.issued`, `license.revoked`, `license.activated`, `license.deactivated`, `license.expired`
- `activation_code.created`, `activation_code.redeemed`
- `session.started`, `session.stopped`
- Admin actions: `admin.*`

Each audit row carries `actor`, `action`, `target_type`, `target_id`, `correlation_id`, `payload`.

## Error reporting

- Errors are logged at `error` with stack and context.
- User-facing error embeds carry a short correlation id (last 6 chars) so support can grep.
- No raw exception text in user-facing messages.

## Health

- A `/healthz` endpoint or equivalent process probe checks: bot is connected to gateway, DB ping succeeds.
- Health failures log at `error` and emit a single line per state transition (not per probe).

## Enforcement

- `backend-reliability` agent reviews logging coverage.
- Lint rule disallows `console.*` in `src/` (except `bootstrap/`).
- PRs that change use-cases must also confirm logging + audit points.
