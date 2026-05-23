# dc-rok

Discord-native control plane. Phase 1 = orchestration only (no game automation).

Governance: see [`.claude/PHASE-0.md`](./.claude/PHASE-0.md).

## Requirements

- Node.js 22 LTS (see [`.nvmrc`](./.nvmrc))
- Docker + Docker Compose (Postgres)
- npm 10+

## Setup

```bash
cp .env.example .env          # then fill in DISCORD_* and ADMIN_DISCORD_USER_IDS
nvm use                       # pick the pinned Node
npm install                   # installs deps + husky hooks
docker compose up -d postgres # start Postgres
npm run db:migrate            # apply migrations
```

## Scripts

- `npm run dev` — run the bot in watch mode (`tsx`).
- `npm run build` — produce `dist/`.
- `npm start` — run the built artifact.
- `npm run check` — lint + typecheck + unit + integration tests.
- `npm run lint` / `npm run lint:fix`
- `npm run format` / `npm run format:check`
- `npm run typecheck`
- `npm run test:unit` / `npm run test:int` / `npm run test:e2e:smoke`
- `npm run db:migrate` — apply migrations.
- `npm run db:reset` — drop & re-apply (dev only).
- `npm run db:studio` — Prisma Studio.

## Layout

```
src/
  shared/        cross-cutting interfaces + infra (Logger, Clock, IdGenerator)
  config/        typed env loader (single env entry point)
  license/       (Phase 1, M2)
  account-link/  (Phase 1, M3)
  session/       (Phase 1, M4)
  audit/         (Phase 1)
  discord/       (Phase 1)
  bootstrap/     composition root
```

Full rules: [`.claude/rules/`](./.claude/rules/).

## Phase boundaries

Phase-2 capabilities (real game automation) are interface-only no-ops in this phase. See [ADR-0012](./.claude/memory/decisions-log.md#adr-0012--phase-2-automation-seams-are-interfaces-only).
