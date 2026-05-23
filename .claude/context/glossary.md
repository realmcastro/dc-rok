# Glossary

Shared vocabulary. Code and conversation must use these terms consistently.

## Identities

- **Discord user** — a real person identified by a Discord user ID. External.
- **Internal user** — our own row in the `users` table. One per Discord user that has interacted.
- **Account link** — the binding between a Discord user and an internal user. May be active, severed, or absent.
- **Actor** — the Discord user who triggered a state change. Recorded in audit.

## License domain

- **License** — a record granting access to the (future) toolset. Has a key, owner (nullable), plan, status, expiry.
- **License key** — the human-shaped secret used at activation. Treated as a secret in transit. Hashed at rest where the use case permits.
- **Plan** — a named tier on a license. Phase 1 has placeholder plans; the tier system is not the focus.
- **Status** — `issued`, `active`, `expired`, `revoked`. A closed enum.
- **Issue** — admin action: create a new license, optionally pre-assigned to an owner.
- **Activate** — user action: bind an unassigned license key to their identity.
- **Deactivate** — user action: release their active license.
- **Revoke** — admin action: forcibly end a license. Audited and irreversible (a new license must be issued).
- **Expire** — system action: status transitions to `expired` past the expiry timestamp.

## Audit

- **Audit event** — an append-only row recording an actor, action, target, time, correlation id, metadata.
- **Correlation id** — short, unique id linking logs and audit entries for one logical operation.

## Discord layer

- **Interaction** — a Discord application command, button, or select submission.
- **Slash command** — a `/name` application command.
- **Handler** — the function that responds to an interaction. A translator, not a brain.
- **Parser** — converts a raw interaction into a typed domain input.
- **Presenter** — converts a domain result into an embed/component.
- **Ephemeral reply** — visible only to the invoking user. Required for anything sensitive.

## Architecture

- **Module** — a top-level domain area under `src/` (`license`, `account-link`, `audit`).
- **Domain layer** — pure code: types, value objects, domain services.
- **Application layer** — use-cases and port interfaces.
- **Infrastructure layer** — adapters: DB, external clients.
- **Port** — an interface declared in `application/ports/` and implemented in `infrastructure/`.
- **Use case** — a class with a single public method (`run`) implementing one user-meaningful action.
- **Composition root** — `src/bootstrap/`, where everything is wired together.

## Process

- **ADR** — Architecture Decision Record. Stored in `.claude/memory/decisions-log.md`.
- **Quality gate** — a check (lint, typecheck, test, security, scope) that must pass before merge.
- **Definition of Done** — the universal "is this PR truly finished?" checklist in `.claude/standards/definition-of-done.md`.

## Phase 2 (forbidden in Phase 1)

These are named so we can refuse them precisely:

- **Game automation** — any code that acts on the game on a user's behalf.
- **Agent runtime** — the (future) component that executes automation tasks.
- **Task stream** — the (future) channel by which agents receive work.
- **Telemetry sink** — the (future) channel by which agents report back.

In Phase 1 these are interface declarations only.
