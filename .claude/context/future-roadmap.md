# Future Roadmap (Phase 2+)

This file is a **conversation record**, not a commitment. Nothing here is built in Phase 1. The point is to keep speculation out of the codebase and confined to this document.

## Phase 2 — Local agent runtime

A script runs on the customer's machine. It connects to the bot's backend, receives tasks (start/stop/parameters), and executes real game actions.

Open questions (resolved before Phase 2 starts):

- Transport: long-poll vs. websocket vs. message broker.
- Authentication: per-agent token derived from license at install time.
- Isolation: does each license correspond to one agent, or can a license drive N agents?
- Telemetry: what does the agent report back, at what cadence, and where does it land?

Seams already in the Phase-1 codebase:

- `AgentRuntimePort` interface in `src/session/application/ports/`. No-op adapter only.
- `TaskStreamPort` interface in `src/session/application/ports/`. No-op adapter only.
- `TelemetrySinkPort` interface in `src/audit/application/ports/`. No-op adapter only.

These interfaces exist so the application layer can be written today without depending on Phase-2 specifics. Implementations must not land during Phase 1.

## Phase 3 — Operational tooling

- Admin web dashboard (probably out-of-process, separate repo).
- Bulk license issuance.
- Customer-facing self-service portal.
- Multi-region deployment.

None of these affect Phase 1's architecture.

## Phase 4+ — Speculative

- Multi-game support behind a `GameProfile` abstraction.
- Plugin model for agent tasks.
- Public API.

The further out a phase is, the less precise its design needs to be. The job of this file is to **catch** speculation that would otherwise drift into the codebase.

## Rules for this file

1. Anything in here is **not built** in Phase 1.
2. Adding to this file is free. Removing or implementing requires an ADR.
3. If a Phase-1 PR proposes work for an item in this file, reject the PR; let the item stay here.
4. Items can be deleted when they become obsolete (e.g., a phase ships or a direction is abandoned). Deletion is logged in an ADR.

## What to do when someone says "we'll need this later"

1. Ask: "Does Phase 1 break without it?" If yes, it is in scope; treat it as Phase 1.
2. If no, add it here (with date and one-line note) and move on.

```
- 2026-MM-DD — <one-line description, why it might matter, what it would cost>
```

## Seed entries

- 2026-05-23 — Agent runtime transport choice (long-poll vs ws vs broker). Defer until Phase 2 kickoff.
- 2026-05-23 — Per-agent token derivation scheme. Defer until Phase 2 kickoff.
- 2026-05-23 — Admin dashboard. Discord remains the only UI for Phase 1; no web admin yet.
- 2026-05-23 — Multi-license-per-account semantics. Phase 1 enforces one active license per account.
