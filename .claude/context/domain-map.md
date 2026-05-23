# Domain Map

A high-level map of the bounded contexts in Phase 1 and how they connect. Each context maps to a top-level module under `src/`.

## Contexts

```
+----------------------------+
|        Identity            |
| (account-link module)      |
| - Discord user ↔ Account   |
+--------------+-------------+
               |
               v
+----------------------------+        +----------------------------+
|        Licensing           |<------>|         Audit              |
| (license module)           |        | (audit module)             |
| - License                  |        | - AuditLog (append-only)   |
| - ActivationCode           |        +----------------------------+
| - Subscription state       |                  ^
+--------------+-------------+                  |
               |                                |
               v                                |
+----------------------------+                  |
|     Automation Session     |------------------+
| (session module)           |
| - AutomationSession        |
| - state: IDLE/ACTIVE/STOPPED|
+----------------------------+
               |
               v
+----------------------------+
|   Phase-2 Seam (no impl)   |
| (agent-runtime placeholder)|
+----------------------------+
```

## Context responsibilities

### Identity (`account-link`)

Owns the relationship between Discord users and internal accounts.

- `Account` — an internal account (`external_account_name`, optional `discord_user_id`, status).
- `AccountLink` — the binding event (when, by whom, current state).
- Use-cases: `LinkAccount`, `UnlinkAccount`, `LookupAccountByDiscordUser`.

### Licensing (`license`)

Owns license issuance, validation, and subscription state.

- `License` — id, status, expiry, max_activations, current_activations, created_by.
- `ActivationCode` — one-time-use code (or with N activations) that binds to a license.
- Use-cases: `IssueLicense`, `RedeemActivationCode`, `RevokeLicense`, `ValidateLicense`.

### Automation Session (`session`)

Owns the user's runtime intent: do they want automation running or stopped? Phase 1 stores intent only; no real automation runs.

- `AutomationSession` — id, account_id, state (`IDLE`/`ACTIVE`/`STOPPED`), started_at, stopped_at.
- Use-cases: `StartSession`, `StopSession`, `GetSessionStatus`.

### Audit (`audit`)

Owns the append-only history of state changes across the other contexts.

- `AuditEvent` — id, actor, action, target, timestamp, correlation_id, metadata.
- Use-cases: `RecordAuditEvent`, `QueryAudit`.

## Cross-context rules

- **Identity** is referenced by **Licensing** and **Session**, but they receive an `accountId` only — never an `Account` entity or DB row.
- **Audit** is written to by every other context through a single port (`AuditPort`). Audit never reads from other contexts at write time.
- **Phase-2 seam** (`agent-runtime` port) is referenced by **Session** through an interface. The interface has a no-op adapter in Phase 1.

## Slash command → context map

| Command   | Primary context | Secondary contexts |
|-----------|-----------------|--------------------|
| `/init`   | Licensing       | Identity, Audit    |
| `/start`  | Session         | Licensing (validate), Audit |
| `/stop`   | Session         | Audit              |
| `/status` | Session         | Licensing, Identity |
| `/reset`  | Identity        | Session, Audit     |

## Failure boundaries

Each context catches and translates its own failures into typed errors. The Discord layer maps typed errors to user-friendly embeds. No cross-context error swallowing.
