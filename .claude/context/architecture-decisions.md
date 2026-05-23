# Architecture Decisions (index)

This file is an **index** of ADRs. The decisions themselves are recorded chronologically in `../memory/decisions-log.md`. Each entry in the log uses the format below.

## ADR format

```
## ADR-NNNN — <short title>

Date: YYYY-MM-DD
Status: proposed | accepted | superseded by ADR-MMMM | rejected
Authors: <who>

### Context
What is the situation that requires a decision? What constraints exist?

### Decision
What did we decide?

### Reason
Why this option over the alternatives?

### Tradeoffs
What did we accept losing in exchange?

### Impact
What changes as a result? What code or process is affected?

### Future revision
What signals would cause us to revisit this?
```

## Pinned decisions (Phase 1)

These are the decisions every contributor must know. The full text lives in `../memory/decisions-log.md`.

- **ADR-0001** — TypeScript + Node.js LTS as the runtime.
- **ADR-0002** — Modular monolith with domain/application/infrastructure layering.
- **ADR-0003** — PostgreSQL as the persistence layer.
- **ADR-0004** — Prisma as the ORM / migration tool.
- **ADR-0005** — Zod for input validation at every trust boundary.
- **ADR-0006** — Pino as the logger.
- **ADR-0007** — discord.js as the Discord client library.
- **ADR-0008** — Vitest as the test runner.
- **ADR-0009** — Docker + docker-compose for local dev (Postgres) and packaging.
- **ADR-0010** — ESLint + Prettier + Husky + lint-staged for code quality gates.
- **ADR-0011** — Phase 1 commands are exactly `/init`, `/start`, `/stop`, `/status`, `/reset`. The list is closed; new commands require an ADR.
- **ADR-0012** — Phase-2 automation seams are interfaces only; no implementation lands in Phase 1.
- **ADR-0013** — Append-only audit log enforced at the DB role level.

These ADR numbers are reserved. The corresponding entries in `../memory/decisions-log.md` may be filled in during initial implementation.

## How to add a new ADR

1. Open `../memory/decisions-log.md`.
2. Append a new entry with the next ADR number.
3. If the decision changes a rule in `.claude/rules/`, update that rule **in the same PR**.
4. Add a one-line summary above under "Pinned decisions" if it is foundational.

## How to supersede an ADR

- Do not delete or rewrite the original ADR.
- Add a new ADR that explicitly says `Status: supersedes ADR-NNNN`.
- Update the original ADR's `Status` line to `superseded by ADR-MMMM`.

## Architectural principles (not ADR-bound)

These predate Phase 1 and need no ADR; they are foundational to the project:

1. Discord is the UI; the database is the truth.
2. Every state change is audited.
3. Dependency direction flows inward.
4. Phase-2 capabilities are seams, not implementations, during Phase 1.
5. Smallest change that proves the outcome.
