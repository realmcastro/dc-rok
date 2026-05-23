# AI Changelog

Append-only log of notable AI-driven changes. Distinct from `CHANGELOG.md` (which is human-readable, customer-facing).

This file exists so a future maintainer can answer "what did the AI do here, and why?".

## Format

```
## YYYY-MM-DD — <title>

Driver: <agent / human prompt summary>
PR: #<number> (if applicable)
Scope: <files / modules>

What changed: <one paragraph>
Why: <one paragraph, ideally linking to an ADR or context file>
Risk: <what to keep an eye on>
Follow-ups: <links to issues, debt entries, or roadmap items>
```

## Entries

## 2026-05-23 — Initial governance scaffold

Driver: human prompt requesting a `.claude/` governance layer before any code is written.
PR: n/a (pre-commit scaffold).
Scope: `.claude/` directory and all its files.

What changed: Created the full `.claude/` governance directory: agents (system-architect, backend-reliability, security, discord-integration, database, testing, developer-experience, product-guardian, scope-enforcer), rules (architecture, coding, security, testing, naming, folder, logging, database, discord, anti-patterns), context (vision, product, ADR index, assumptions, glossary, domain-map, future-roadmap), workflows (feature, bugfix, refactor, database-change, release, review-checklist), standards (DoD, quality-gates, test-standards, observability, error-handling), and memory (decisions-log with ADR-0001 through ADR-0013, technical-debt seed, known-risks seed, this changelog).

Why: The project requires a disciplined operational layer before implementation begins to prevent architectural drift, scope creep, and quality degradation over time. The structure encodes Phase-1 boundaries (commands `/init` `/start` `/stop` `/status` `/reset` only; no game automation) and the chosen stack (TypeScript, Node LTS, discord.js, Postgres, Prisma, Zod, Pino, Vitest, Docker, ESLint/Prettier/Husky).

Risk: The agents and rules are only as effective as the contributors who read them. The auto-routing config under `.claude/routing/` and the Claude Code hooks under `.claude/settings.json` should be respected by the AI assistant on every task; the human review remains the final gate.

Follow-ups:
- Fill in `prisma/schema.prisma` and the first migration once implementation begins.
- Author the import-boundary lint configuration referenced by `architecture-rules.md`.
- Wire Husky hooks per `quality-gates.md`.
