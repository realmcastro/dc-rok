# .claude — Project Governance Layer

This directory is the **operational control plane** of the dc-rok project. It exists to preserve architectural consistency, prevent scope drift, encode decisions, and discipline how features are delivered.

It is not documentation in the casual sense. Every file here is **load-bearing**: agents read from it, contributors are bound by it, and reviewers enforce it.

## Layout

| Folder | Purpose |
|--------|---------|
| `agents/` | Specialist roles. Each agent has a narrow mandate, hard rules, and a review checklist. |
| `rules/` | Hard, enforceable rules across architecture, coding, security, testing, naming, etc. |
| `context/` | Persistent project understanding: product, domain, vision, glossary. |
| `workflows/` | Step-by-step pipelines for delivering features, fixes, refactors, and DB changes. |
| `standards/` | Quality gates and Definition of Done. |
| `memory/` | Append-only logs: decisions (ADRs), technical debt, risks, AI-driven changes. |
| `routing/` | Routing table + example settings for **auto-switching** specialist agents per task. |
| `hooks/` | Read-only Claude Code hook scripts that implement the auto-switching. |

## Reading order for a new contributor

0. `PHASE-0.md` (the entry point — restates everything and maps to files)
1. `context/project-vision.md`
2. `context/product-context.md`
3. `context/architecture-decisions.md` → `memory/decisions-log.md`
4. `rules/architecture-rules.md`
5. `rules/anti-patterns.md`
6. `workflows/feature-delivery.md`
7. `standards/definition-of-done.md`

## Reading order for an AI agent on every task

1. `agents/scope-enforcer.md` — confirm the task is in scope.
2. `agents/product-guardian.md` — confirm it serves the MVP goal.
3. The relevant specialist agent file (e.g. `discord-integration.md`).
4. `rules/anti-patterns.md` — make sure the planned approach is not on the banned list.
5. `workflows/feature-delivery.md` — follow the pipeline.
6. `standards/quality-gates.md` — verify every gate before declaring done.

## Hard boundaries (Phase 1)

In scope: Discord integration, slash commands, account ↔ user linking, license, internal state, status visuals, persistence, audit.

**Out of scope (placeholders only, never implementation):** game automation, real websocket client, local execution, remote execution, OCR, screenshot engine, macros, botting logic, desktop automation.

See `rules/architecture-rules.md` §Scope and `agents/scope-enforcer.md`.

## Change protocol

Any change to files under `.claude/` is a governance change. It requires:

1. An entry in `memory/decisions-log.md` (ADR format).
2. Review from the `system-architect` agent role.
3. Justification linked to product goals in `context/project-vision.md`.

Never silently edit a rule. Rules are versioned through ADRs.
