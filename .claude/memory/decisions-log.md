# Decisions Log (ADRs)

Append-only. Each ADR is a permanent record of a structural decision. Use the format defined in `../context/architecture-decisions.md`.

Earlier numbers may be reserved before they are filled in. Once filled, they are immutable except via a superseding ADR.

---

## ADR-0001 — TypeScript + Node.js LTS

Date: 2026-05-23
Status: accepted
Authors: project bootstrap

### Context
The bot needs first-class Discord support, a strong type system to keep domain rules safe, and a low-friction deployment path.

### Decision
Use **TypeScript** with `strict: true` on the current Node.js LTS line, pinned via `.nvmrc` and `package.json#engines`.

### Reason
- `discord.js` is first-class on Node.
- TypeScript catches the class of errors most likely in a license/audit codebase.
- LTS gives us a predictable runtime for 18+ months.

### Tradeoffs
- A second build step (TS → JS) versus a JS-only project.
- TypeScript discipline imposes a learning curve on contributors.

### Impact
- `tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- CI runs `tsc --noEmit` as a gate.

### Future revision
Revisit if/when Bun or Deno reach feature parity for our Discord stack and we have a clear migration plan.

---

## ADR-0002 — Modular monolith with layered modules

Date: 2026-05-23
Status: accepted

### Context
Phase 1 has a small, well-bounded scope. A microservice split would be premature; a flat single-folder layout would not survive Phase 2.

### Decision
Modular monolith. One deployable. Top-level modules: `license`, `account-link`, `session`, `audit`, `discord`, `config`, `bootstrap`, `shared`. Inside each module: `domain/`, `application/`, `infrastructure/`.

### Reason
- Clear ownership per module.
- Inner-outward dependency direction prevents accidental coupling.
- Easy to extract a module to a separate process if/when Phase 2 demands it.

### Tradeoffs
- More files than a flat layout.
- Discipline required to keep boundaries clean.

### Impact
- `architecture-rules.md` and `folder-rules.md` codify the structure.
- Lint rule enforces import boundaries.

### Future revision
Revisit if a module truly cannot be expressed within this layout (rare in Phase 1).

---

## ADR-0003 — PostgreSQL

Date: 2026-05-23
Status: accepted

### Context
We need transactional persistence with strong constraints, an append-only audit table, and a path to grow without re-platforming.

### Decision
Use **PostgreSQL** as the only persistence engine.

### Reason
- Transactions, constraints, JSONB, and broad hosting support.
- Append-only enforcement is straightforward via per-role grants.
- Wide team familiarity.

### Tradeoffs
- Heavier than SQLite for local dev. Mitigated by `docker-compose`.

### Impact
- Local dev via `docker compose up postgres`.
- `prisma/schema.prisma` targets PostgreSQL.

### Future revision
None expected during Phase 1.

---

## ADR-0004 — Prisma ORM + migrations

Date: 2026-05-23
Status: accepted

### Context
We need typed access to Postgres and a migration tool that integrates well with TypeScript.

### Decision
Use **Prisma**. Schema in `prisma/schema.prisma`. Migrations in `prisma/migrations/`.

### Reason
- Strong TypeScript integration.
- Built-in migration tooling.
- Good DX for a Phase-1-sized schema.

### Tradeoffs
- Prisma's generator runs on schema changes; small build-step overhead.
- For exotic queries, raw SQL escape hatch is acceptable inside `infrastructure/`.

### Impact
- `npm run db:*` scripts wrap Prisma commands.
- `database-change-process.md` codifies migration discipline.

### Future revision
Revisit if Prisma's roadmap diverges from our needs around audit or partitioning.

---

## ADR-0005 — Zod for input validation

Date: 2026-05-23
Status: accepted

### Context
Inputs from Discord are untrusted. We need a single, expressive validator that produces typed values.

### Decision
Use **Zod** for all input parsing at trust boundaries (Discord parsers, env config).

### Reason
- Schema-as-code that produces TypeScript types.
- Composable, well-supported.

### Tradeoffs
- Minor runtime cost; negligible for Phase-1 interaction volume.

### Impact
- Every command has a `*.parser.ts` using Zod.
- `src/config/` uses Zod to validate `process.env`.

---

## ADR-0006 — Pino logger

Date: 2026-05-23
Status: accepted

### Context
We need structured JSON logs in production and readable logs in development.

### Decision
Use **Pino**, with `pino-pretty` only in development.

### Reason
- Fast, structured, ubiquitous.
- Built-in child loggers fit our correlation-id pattern.

### Tradeoffs
- Some log destinations require adapters; acceptable.

### Impact
- `src/shared/infrastructure/logger.ts` exposes a `Logger` interface and the Pino implementation.
- Lint rule bans `console.*` in `src/`.

---

## ADR-0007 — discord.js client

Date: 2026-05-23
Status: accepted

### Context
We need a maintained Discord library with first-class slash-command support.

### Decision
Use **discord.js** (current major version).

### Reason
- Best supported, most documented.
- Handles rate limiting and gateway resilience for us.

### Tradeoffs
- Some advanced features lag behind the raw API; not relevant for Phase 1.

### Impact
- `src/discord/runtime/` wraps client setup.
- Intents declared minimally: `Guilds` (and `GuildMembers` if linking requires it).

---

## ADR-0008 — Vitest

Date: 2026-05-23
Status: accepted

### Context
We need a fast TypeScript-native test runner.

### Decision
Use **Vitest**.

### Reason
- Native ESM + TS support.
- Watch mode, fake timers, mocks.
- Fast on developer machines.

### Tradeoffs
- Slightly smaller plugin ecosystem than Jest. Sufficient for Phase 1.

### Impact
- Unit, integration, and handler tests all use Vitest.
- CI scripts call `npm run test:unit`, `npm run test:int`, `npm run test:e2e:smoke`.

---

## ADR-0009 — Docker for dev and packaging

Date: 2026-05-23
Status: accepted

### Context
We need a reproducible local environment (Postgres) and a portable runtime artifact.

### Decision
Use **Docker** for local Postgres via `docker-compose.yml`, and a `Dockerfile` for the bot image.

### Reason
- One command up: `docker compose up -d postgres`.
- Production parity from day one.

### Tradeoffs
- Adds Docker as a contributor prerequisite. Acceptable.

### Impact
- `docker-compose.yml` runs Postgres for local dev.
- `Dockerfile` is a multi-stage build with a minimal runtime image.

---

## ADR-0010 — ESLint + Prettier + Husky + lint-staged

Date: 2026-05-23
Status: accepted

### Context
We need automatic formatting, lint, and pre-commit gates to prevent obvious regressions.

### Decision
Adopt **ESLint** + **Prettier**, wired via **Husky** hooks and **lint-staged**.

### Reason
- Standard, well-supported toolchain.
- Catches lint and format issues at commit time, not in CI.

### Tradeoffs
- A `prepare` script must run on install; acceptable.

### Impact
- `npm install` runs `husky install` via `prepare`.
- `pre-commit`: `lint-staged` formats and lints staged files.
- `pre-push`: `npm run typecheck && npm run test:unit`.

---

## ADR-0011 — Phase-1 slash command surface is closed

Date: 2026-05-23
Status: accepted

### Context
Without a hard cap, the command surface drifts during implementation.

### Decision
Phase 1 ships exactly five end-user commands: `/init`, `/start`, `/stop`, `/status`, `/reset`. Admin commands are scoped separately.

### Reason
- Each command maps to a clear product outcome.
- New commands require a vision-level conversation, not a casual PR.

### Tradeoffs
- A new feature idea cannot piggy-back on the bot's surface without a new ADR.

### Impact
- `scope-enforcer` agent rejects PRs adding non-listed commands.

---

## ADR-0012 — Phase-2 automation seams are interfaces only

Date: 2026-05-23
Status: accepted

### Context
Phase 2 will add a local agent runtime. Tempting to "prepare" with stubs; this corrodes the codebase.

### Decision
Phase-1 code may declare interfaces for `AgentRuntimePort`, `TaskStreamPort`, `TelemetrySinkPort`. **Implementations** of these interfaces during Phase 1 are no-ops only. Real implementations are forbidden until Phase 2 is formally started.

### Reason
- Allows the application layer to be written without depending on Phase-2 specifics.
- Prevents Phase-2 code from creeping in under different names.

### Tradeoffs
- Some abstraction overhead today. Justified by the clean handoff later.

### Impact
- Each port has a `NoopXxx` adapter in `infrastructure/`.
- `scope-enforcer` flags any non-no-op implementation.

---

## ADR-0013 — Append-only audit at the DB role level

Date: 2026-05-23
Status: accepted

### Context
Audit must be a credible record. Application-level "I promise not to update" is not enough.

### Decision
The application's DB role has `INSERT`-only privileges on `audit_logs`. A separate, restricted role can read; no role can `UPDATE`/`DELETE` in normal operation.

### Reason
- Defense in depth.
- Audit corruption (intentional or accidental) requires explicit operator action.

### Tradeoffs
- One more role to manage in deployment scripts.

### Impact
- Database setup script grants `INSERT` only to the app role on `audit_logs`.
- Tests use a privileged role; production does not.
