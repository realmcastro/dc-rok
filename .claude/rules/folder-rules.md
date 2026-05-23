# Folder Rules

## Purpose

Define what may and may not live where. The repo layout is the first thing a reader sees; it must be unambiguous.

## Repo layout

```
/
  .claude/                governance layer (this directory)
  .github/                CI workflows, issue templates
  docs/                   long-form architecture docs (rare; prefer ADRs)
  migrations/             SQL or migration tool files
  src/                    application source (see architecture-rules.md)
  tests/                  cross-cutting tests (e2e, fixtures)
  scripts/                one-off scripts; each documented in scripts/README.md
  .env.example
  package.json
  tsconfig.json
  README.md
```

## src/ layout

Defined in `architecture-rules.md`. Recap:

```
src/
  shared/
  license/
  account-link/
  session/
  audit/
  discord/
  config/
  bootstrap/
```

## Per-module layout

Every domain module:

```
<module>/
  domain/                 pure types and rules
  application/            use-cases + ports (interfaces)
  infrastructure/         adapters implementing ports
  index.ts                module public surface (re-exports allowed only here)
```

## Where things go

| Thing | Goes in |
|-------|---------|
| Domain entity / value object | `<module>/domain/` |
| Domain service (pure) | `<module>/domain/` |
| Use case | `<module>/application/` |
| Port interface | `<module>/application/ports/` |
| Adapter (DB, external client) | `<module>/infrastructure/` |
| DTO crossing module boundary | `<module>/application/dto/` |
| Slash command handler | `src/discord/commands/<command>/` |
| Embed/presenter | `src/discord/presenters/` or co-located under command |
| Env loading | `src/config/` |
| Wiring | `src/bootstrap/` |
| Shared clock, ids, errors | `src/shared/domain/` (interfaces) and `src/shared/infrastructure/` (impl) |

## Forbidden

- `src/utils/`, `src/lib/`, `src/common/` as catch-alls. If something is shared, put it in `src/shared/` with a real domain name.
- Mixing modules in a single directory.
- Tests outside `src/` (except cross-cutting in `tests/`).
- Generated files committed under `src/`. They go in `src/__generated__/` and are gitignored when reproducible.

## Index files

- Each module has an `index.ts` that exports only its public surface (use-cases, DTOs, port types).
- No barrel files inside a module's internals.

## Enforcement

- `system-architect` agent reviews new directories.
- Lint rule restricts cross-module deep imports.
- ADR required to add a new top-level `src/<module>/`.
