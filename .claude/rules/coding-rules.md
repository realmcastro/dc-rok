# Coding Rules

## Purpose

Define the per-line standards for code in this project.

## Language

- TypeScript, `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- ESM modules. No CommonJS.
- Target the project's pinned Node.js LTS (declared in `.nvmrc` and `package.json#engines`).

## Types

1. No `any`. Use `unknown` and narrow.
2. No `as` casts at I/O boundaries. Parse instead (`zod` or chosen validator).
3. Prefer discriminated unions over boolean flags for state.
4. Domain types live in `domain/`; infrastructure types do not leak.
5. Use branded types for IDs (e.g., `LicenseId`, `DiscordUserId`).

## Functions

- Pure functions in `domain/` are the default. No side effects.
- Async functions handle their own timeouts (see `error-handling-standard.md`).
- One concept per function. Functions over ~40 lines need justification.
- Arguments are objects when there are more than two, or when order is non-obvious.

## Naming

See `naming-rules.md`.

## Imports

- Absolute imports rooted at `src/` via path alias `@/`.
- No deep imports into another module's internals.
- Sorted: external → `@/*` (own modules) → relative.

## Comments

- Comment **why**, not what. Code already says what.
- TODOs include an issue link and an owner: `// TODO(#42, @owner): ...`.
- JSDoc only on exported public API of a module.

## Errors

- Throw typed errors derived from `DomainError` / `InfrastructureError`.
- Never throw strings or plain `Error` in business code.
- Never swallow errors. See `error-handling-standard.md`.

## Async

- No fire-and-forget without an explicit comment justifying it.
- `Promise.all` only when results are independent. Otherwise sequential.
- No `await` inside tight CPU loops.

## Side-effect ordering

- Read → decide → act. No partial side effects scattered through a function body.

## Logging

See `logging-rules.md`.

## Forbidden

- `console.log` in `src/`. Use the logger.
- `eval`, `Function` constructor, `vm`.
- Top-level await outside `bootstrap`.
- `process.exit` outside `bootstrap` shutdown handlers.
- Dynamic `require`.

## Allowed exceptions

- `console.error` in `bootstrap/` for catastrophic startup failures before the logger is wired.

## Enforcement

- ESLint config that codifies these rules.
- Pre-commit hook runs lint + typecheck.
- `system-architect` and `backend-reliability` agents review on PR.
