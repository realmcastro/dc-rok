# Naming Rules

## Purpose

Names are the cheapest documentation. They must be precise, consistent, and domain-driven.

## General

- Names describe **what a thing is in the domain**, not how it is implemented.
- No abbreviations except universally understood ones (`id`, `url`, `db`, `http`).
- No Hungarian notation. No type suffixes (`UserClass`, `IRepository`).
- Plural where the thing is plural (`licenses` for a collection, `license` for one).

## Files & directories

- `kebab-case.ts` for files.
- `kebab-case/` for directories.
- One exported type/class/function per file when possible. Co-locate small helpers used by only that file.
- Test files: `name.test.ts`, `name.int.test.ts`, `name.e2e.test.ts`.

## Identifiers

- `camelCase` for variables, functions, methods.
- `PascalCase` for types, classes, enums.
- `SCREAMING_SNAKE_CASE` for true constants (compile-time).
- `kebab-case` for env vars only when the platform requires it; project standard is `SCREAMING_SNAKE_CASE`.

## Booleans

- `is*` / `has*` / `can*` / `should*` / `was*`.
- No double negatives. `isEnabled`, not `isNotDisabled`.

## Functions

- Verb-first: `activateLicense`, `parseInteraction`, `findUserById`.
- Pure functions reading state: noun OK (`activeLicensesFor(userId)`), but prefer `find` / `get`.
- `get*` for cheap, in-memory accessors. `fetch*` for I/O. `load*` for explicit lazy.

## Use cases

- Application use-case class names are verb phrases: `ActivateLicense`, `LinkAccount`.
- The method is `run` or `execute`. Consistent across the project. Pick one (project default: `run`).

## Ports & adapters

- Port (domain interface): noun + `Repository` / `Service` / `Client` (e.g., `LicenseRepository`).
- Adapter implementation: technology prefix + port name (e.g., `PostgresLicenseRepository`, `DiscordRestClient`).

## Discord commands

- Slash command names: lowercase, hyphenated, ≤ 32 chars (Discord limit). Example: `/license-activate`.
- Handler file: `<command>.handler.ts`. Parser file: `<command>.parser.ts`. Presenter: `<command>.presenter.ts`.

## Database

- Table names: `snake_case`, plural (`licenses`, `account_links`, `audit_events`).
- Column names: `snake_case`.
- Foreign keys: `<referenced_table_singular>_id`.
- Timestamps: `created_at`, `updated_at`, `deleted_at`.
- Booleans: `is_active`, `has_*`, etc.

## Migrations

- Filename: `<timestamp>_<verb>_<subject>.sql` (or chosen tool's format).
- One migration = one logical change.

## Forbidden

- `data`, `info`, `obj`, `temp`, `tmp`, `foo`, `bar`, `stuff` outside tests.
- `Manager`, `Helper`, `Util` without a domain word.
- `*Service` when the class is a use-case (use the verb phrase).
- Comments that exist only because the name is unclear. Rename instead.

## Enforcement

- ESLint naming-convention rules.
- Code review by relevant specialist agent.
