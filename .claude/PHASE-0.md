# Phase 0 — Understanding & Deliverables Map

This document is the **entry point** for Phase 0 of dc-rok. It restates the product, lists the assumptions and decisions, and maps each mandated deliverable to its file in this governance layer.

Phase 0 ends when this file is read, the underlying documents are reviewed, and the implementation plan is approved.

## 1. Product understanding

A Discord-native control plane for a managed Rise of Kingdoms toolset. Phase 1 implements **only** the orchestration layer: link Discord accounts to managed accounts, validate license/subscription, accept slash commands, persist state, manage session intent, surface status. No game automation — Phase 2 will add the local agent runtime.

End-user surface (Phase 1, closed list): `/init`, `/start`, `/stop`, `/status`, `/reset`.

Full product context: [`context/product-context.md`](context/product-context.md), [`context/project-vision.md`](context/project-vision.md), [`context/glossary.md`](context/glossary.md), [`context/domain-map.md`](context/domain-map.md).

## 2. Assumptions & Decisions

- Assumptions: [`context/assumptions.md`](context/assumptions.md).
- Decisions: [`memory/decisions-log.md`](memory/decisions-log.md) (ADR-0001 through ADR-0013).
- Decision index: [`context/architecture-decisions.md`](context/architecture-decisions.md).

Pragmatic, MVP-extensible. Defaults to: simpler, more auditable, more ephemeral.

## 3. Project Rulebook

Hard, enforceable rules across the codebase:

- Architecture: [`rules/architecture-rules.md`](rules/architecture-rules.md)
- Coding: [`rules/coding-rules.md`](rules/coding-rules.md)
- Naming: [`rules/naming-rules.md`](rules/naming-rules.md)
- Folder layout: [`rules/folder-rules.md`](rules/folder-rules.md)
- Security: [`rules/security-rules.md`](rules/security-rules.md)
- Logging: [`rules/logging-rules.md`](rules/logging-rules.md)
- Database: [`rules/database-rules.md`](rules/database-rules.md)
- Discord: [`rules/discord-rules.md`](rules/discord-rules.md)
- Testing: [`rules/testing-rules.md`](rules/testing-rules.md)
- Anti-patterns: [`rules/anti-patterns.md`](rules/anti-patterns.md)

## 4. Architecture Proposal

Modular monolith. Layers per module: `domain/` → `application/` → `infrastructure/`. Discord is an interface layer; the database is the source of truth. Phase-2 capabilities exist as **port interfaces with no-op adapters only**.

Full proposal: [`rules/architecture-rules.md`](rules/architecture-rules.md), [`rules/folder-rules.md`](rules/folder-rules.md), [`context/domain-map.md`](context/domain-map.md).

Layer diagram:

```
discord  →  application  →  domain
              ↓
        infrastructure
              ↓ (implements domain ports)
            domain
```

## 5. Agents Definition

Specialist roles enforced on every PR. Each agent has a mission, hard rules, anti-patterns, and a validation checklist.

| Agent | File |
|-------|------|
| system-architect | [`agents/system-architect.md`](agents/system-architect.md) |
| backend-reliability | [`agents/backend-reliability.md`](agents/backend-reliability.md) |
| security | [`agents/security.md`](agents/security.md) |
| discord-integration | [`agents/discord-integration.md`](agents/discord-integration.md) |
| database | [`agents/database.md`](agents/database.md) |
| testing | [`agents/testing.md`](agents/testing.md) |
| developer-experience | [`agents/developer-experience.md`](agents/developer-experience.md) |
| product-guardian | [`agents/product-guardian.md`](agents/product-guardian.md) |
| scope-enforcer | [`agents/scope-enforcer.md`](agents/scope-enforcer.md) |

Auto-switching mechanism: [`routing/agent-router.md`](routing/agent-router.md), [`routing/auto-switch.md`](routing/auto-switch.md), [`hooks/README.md`](hooks/README.md).

## 6. Domain Modeling

Bounded contexts, entities, state transitions, and cross-context rules: [`context/domain-map.md`](context/domain-map.md) and [`context/glossary.md`](context/glossary.md).

Phase-1 entities: `Account`, `License`, `ActivationCode`, `AutomationSession`, `AuditEvent`.

## 7. Database Schema (intent)

Conceptual schema in [`rules/database-rules.md`](rules/database-rules.md) §"Phase-1 core schema (intent)". Tables:

- `accounts`
- `licenses`
- `activation_codes`
- `automation_sessions`
- `audit_logs` (append-only at the DB role level — see ADR-0013)

The concrete Prisma schema lands in `prisma/schema.prisma` during implementation, reviewed by the `database` agent per [`workflows/database-change-process.md`](workflows/database-change-process.md).

## 8. Folder Structure

Repo layout: [`rules/folder-rules.md`](rules/folder-rules.md).

`src/` modules (Phase 1): `shared`, `license`, `account-link`, `session`, `audit`, `discord`, `config`, `bootstrap`.

## 9. Discord Command Flow

Per-command flow (parse → use-case → present), handler shape, embed conventions, intents policy: [`rules/discord-rules.md`](rules/discord-rules.md) and the per-command sketches in [`context/product-context.md`](context/product-context.md).

Closed surface (ADR-0011): `/init`, `/start`, `/stop`, `/status`, `/reset`.

Per-command intent:

- `/init code:<activation_code>` → validate code, validate license, bind Discord user to Account, mark session/device, audit, ephemeral reply.
- `/start` → validate license + link, set session `ACTIVE`, audit, ephemeral reply.
- `/stop` → set session `STOPPED`, audit, ephemeral reply.
- `/status` → render status card (account, session state, license, expiry, uptime, last start/stop, health).
- `/reset` → confirmation flow → unlink, invalidate session, clear state, keep audit.

## 10. Security Plan

Threat model, secrets handling, audit guarantees, rate limiting: [`rules/security-rules.md`](rules/security-rules.md), [`agents/security.md`](agents/security.md), [`memory/known-risks.md`](memory/known-risks.md).

Highlights:

- All secrets via `src/config/`; no `process.env` elsewhere.
- License keys hashed at rest (ADR-0011, TD-0002).
- Audit append-only at the DB role level (ADR-0013).
- Per-user rate limit on `/init` (R-0001).
- Discord intents: minimum required; `MessageContent` forbidden.

## 11. Implementation Plan

The implementation **does not** start in this Phase 0. The first implementation milestone, when authorized, is:

**M1 — Bootstrap & Config**

- `tsconfig.json`, ESLint, Prettier, Husky, lint-staged, Vitest.
- `src/config/` with Zod-validated env.
- `src/shared/` with `Logger`, `Clock`, `IdGenerator`, error base classes.
- `docker-compose.yml` with Postgres.
- `prisma/schema.prisma` (initial models for `accounts`, `licenses`, `activation_codes`, `automation_sessions`, `audit_logs`).
- First migration applied.

**M2 — License & Activation**

- `src/license/` domain + application + Prisma adapter.
- Admin license-issuing path (not a slash command yet).
- Activation-code redemption use-case.

**M3 — Account Link & /init**

- `src/account-link/` domain + application + Prisma adapter.
- `/init` slash command end-to-end.
- Audit entries for link events.

**M4 — Session & /start /stop**

- `src/session/` domain (state machine).
- `/start`, `/stop` handlers.
- `NoopAgentRuntimePort` implementation (Phase-2 seam).

**M5 — /status**

- Status presenter producing a polished embed.
- Health checks (gateway connected, DB reachable).

**M6 — /reset**

- Confirmation flow (button component handler).
- Unlink + session invalidation use-case.
- Audit guarantee.

**M7 — Hardening**

- Rate limits.
- Security review (`/security-review`).
- Manual smoke + E2E test pass.
- Release `0.1.0`.

Each milestone is one or more PRs. Each PR follows [`workflows/feature-delivery.md`](workflows/feature-delivery.md) and passes [`standards/quality-gates.md`](standards/quality-gates.md).

## 12. Milestones

See §11. M1 → M7. No code lands until M1 is authorized.

## 13. Strategy for evolution

[`context/future-roadmap.md`](context/future-roadmap.md) catalogues Phase-2+ ideas without committing them to code. The architecture exposes interfaces (`AgentRuntimePort`, `TaskStreamPort`, `TelemetrySinkPort`) so the Phase-2 implementation can land without rewriting the application layer.

## 14. Anti-patterns (forbidden)

[`rules/anti-patterns.md`](rules/anti-patterns.md). Highlights:

- Business logic in Discord handlers.
- `any` to silence the type system.
- Singletons, magic strings, implicit state.
- "Just in case" code.
- Renaming columns in a single migration.
- Phase-2 capability under a different name.

## Tradeoffs at Phase 0

| Decision | What we gain | What we accept |
|----------|--------------|----------------|
| Modular monolith | Clear boundaries, one deploy | More files than a flat layout |
| Prisma | Typed DB access, migrations | Generator step, schema-first thinking |
| Phase-2 as no-op ports | Clean handoff later | Some abstraction overhead now |
| Closed command surface | No drift | New commands require an ADR |
| Append-only audit at role level | Forensic credibility | One more DB role to manage |

## Risks to track

[`memory/known-risks.md`](memory/known-risks.md): activation-code brute-force (R-0001), token compromise (R-0002), audit role drift (R-0003), slash-command drift (R-0004), Phase-2 creep (R-0005), partial migration (R-0006).

## Future improvements (not now)

[`context/future-roadmap.md`](context/future-roadmap.md). Includes Phase-2 transport choice, per-agent token derivation, admin dashboard, multi-license semantics.

## Phase 0 exit criteria

- [ ] Product understanding read and confirmed.
- [ ] Assumptions reviewed; corrections raised as needed.
- [ ] ADR-0001 through ADR-0013 acknowledged.
- [ ] Agent roster and routing reviewed.
- [ ] Implementation plan (M1 → M7) accepted.
- [ ] No outstanding scope ambiguity.

Only then does M1 begin.
