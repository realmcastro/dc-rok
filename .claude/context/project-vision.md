# Project Vision

## What dc-rok is

A Discord-native control plane for a managed Rise of Kingdoms toolset.

In Phase 1 it is **only** a Discord bot that links accounts, manages licenses, and surfaces status. The toolset itself — anything that interacts with the game — is **not** built in Phase 1. The Discord layer is the product surface and the source of truth for "who can do what".

## Why Discord first

- Distribution: the user base already lives there.
- UX: slash commands and embeds give us a polished interface at zero front-end cost.
- Identity: Discord user IDs are stable, free, and already trusted by the user base.
- Audit: an ephemeral, structured message history is a usable audit surface during Phase 1.

## Phase 1 (current) — Discord control plane

Goal: prove the control plane works in isolation, with no automation behind it.

In scope:

- Discord bot (login, gateway, command registration).
- Slash commands for account link, license activate/deactivate/status, audit query.
- Account ↔ Discord user linking.
- License domain (issue, activate, deactivate, expire, audit).
- Internal state model.
- Status visuals (embeds, components).
- Persistence (Postgres + migrations).
- Audit log.

Out of scope, even as stubs: game automation, OCR, screenshots, websockets to game servers, macros, desktop automation. These names are reserved in the architecture (`*-placeholder` interfaces) but contain no implementation.

## Phase 2 (future) — Automation backplane

Speculative. Documented in `future-roadmap.md`. No code lands for it during Phase 1.

The architectural seams left for Phase 2:

- An `agent-runtime` port that the license module can grant or revoke access to.
- A `task-stream` port that future runtimes can subscribe to.
- A `telemetry-sink` port for future runtimes to report back.

In Phase 1 these are interface declarations with no implementations.

## Non-goals

- A general-purpose Discord moderation bot.
- A licensing SaaS for third parties.
- A multi-game framework.

## Principles

1. **Smallest thing that proves the outcome.** Always.
2. **Discord is the UI, not the model.** State lives in the database, not in messages.
3. **Every state change is auditable.** No exceptions.
4. **Phase 2 stays a conversation until Phase 1 ships.**

## Definition of "Phase 1 done"

- All in-scope slash commands exist, parse strictly, and reply with embeds.
- Account link round-trips against the database.
- License lifecycle (issue → activate → expire) is observable via commands.
- Audit query returns the right entries for a given actor/target.
- CI is green: lint, typecheck, unit, integration, smoke E2E.
- Security review passed (`/security-review`).
- Onboarding from fresh checkout works in under 10 minutes.

## Anti-vision

If a contributor proposes "let's make this configurable", "let's add a plugin system", "let's prepare for the automation layer now" — push back. Phase 1 wins by being small, observable, and shippable.
