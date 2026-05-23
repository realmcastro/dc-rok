# Architecture Rules

## Purpose

Define the structural rules every contributor — human or AI — must follow when adding or modifying code. These rules are enforceable: the `system-architect` agent rejects PRs that violate them.

## Style: Modular monolith

One deployable artifact. Multiple **modules** with clear boundaries. Each module owns its domain, application, and infrastructure code.

```
src/
  shared/                  shared kernel: types, errors, clock, ids, config
    domain/
    application/
    infrastructure/
  license/                 module: License + ActivationCode
    domain/
    application/
    infrastructure/
  account-link/            module: Account + Discord-user binding
    domain/
    application/
    infrastructure/
  session/                 module: AutomationSession state machine
    domain/
    application/
    infrastructure/
  audit/                   module: AuditLog (append-only)
    domain/
    application/
    infrastructure/
  discord/                 interface layer (Discord = UI for this project)
    commands/              one folder per slash command (/init /start /stop /status /reset)
      init/
      start/
      stop/
      status/
      reset/
    presenters/            shared embed/component builders
    runtime/               client setup, intents, registration
  config/                  typed env loader (Zod schema), single source of truth
  bootstrap/               composition root: wires modules together
```

## Dependency direction

```
discord  →  application  →  domain
              ↓
        infrastructure
              ↓ (depends on domain interfaces only)
            domain
```

- `domain` depends on nothing else.
- `application` depends on `domain`.
- `infrastructure` depends on `domain` (implements interfaces declared there).
- `discord` depends on `application` only.
- `bootstrap` depends on all of them; nothing depends on `bootstrap`.

No cycles. No skipping. Enforced by the test suite (an import-graph test should exist).

## Module boundaries

- Modules talk to each other only through **application-layer ports**, never by reaching into another module's `domain` or `infrastructure`.
- Cross-module data crosses as DTOs, not as ORM entities.
- A module's `domain` is private to that module.

## Composition

All wiring lives in `src/bootstrap/`. No `new` of a repository or external client outside `bootstrap` or tests.

## Side effects

- No top-level side effects in any module file. No reading env, no opening connections.
- Side effects begin in `bootstrap`.

## Forbidden patterns

- Business logic in Discord handlers.
- Direct DB access from Discord layer.
- Service classes named `Manager`, `Helper`, `Util`, `Handler` (without a domain word).
- A single file mixing two unrelated modules.
- Re-exports just to dodge import paths.

## Allowed exceptions

- Tests may construct modules directly without going through `bootstrap`.
- Prototypes under `experiments/` are exempt from layering rules and must be deleted or ADR'd before merging to `main`.

## Scope (Phase 1)

See `../agents/scope-enforcer.md`. The architecture must expose **placeholder interfaces** for Phase 2 automation seams, but every placeholder is a no-op until the relevant ADR.

## Enforcement

- Lint rule (import boundaries plugin) enforces dependency direction in CI.
- `system-architect` agent reviews every PR touching module structure.
- ADR required to add, rename, or remove a module.
