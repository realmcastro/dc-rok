# Database Rules

## Purpose

Define schema and query discipline. Owned by the `database` agent.

## Engine

- PostgreSQL (chosen for transactional safety, JSONB, and broad hosting support).
- Prisma as the ORM. Schema in `prisma/schema.prisma`. Migrations under `prisma/migrations/`.
- Raw SQL allowed inside `infrastructure/` only for the few cases Prisma cannot express cleanly (justified per-call with a comment).

## Schema rules

1. Primary keys: ULID (sortable, opaque to users).
2. Foreign keys: enforced at DB level, with `ON DELETE` semantics chosen explicitly (`CASCADE`, `RESTRICT`, `SET NULL`).
3. Timestamps: `created_at timestamptz NOT NULL DEFAULT now()`. `updated_at timestamptz NOT NULL DEFAULT now()` on mutable tables.
4. Soft delete (`deleted_at timestamptz`) only when an ADR justifies it.
5. Booleans default explicitly. No "tri-state" booleans; use enums or nullable timestamps.
6. Enums: PostgreSQL enums for closed sets; otherwise a `CHECK` constraint or a reference table.
7. JSONB allowed only for genuinely schemaless data; documented in the table comment.

## Indexes

- Index every column that appears in `WHERE`, `JOIN`, `ORDER BY`, or unique constraints.
- Composite indexes match query order.
- Each index has a documented purpose in the migration.

## Migrations

1. Forward-only. No editing applied migrations.
2. One logical change per migration.
3. Destructive changes are two-phase across releases:
   - Release N: stop writing the column / table.
   - Release N+1 (after backups verified): `DROP`.
4. Renames: add new → backfill → switch reads → drop old. Never rename in place.
5. Backfills for large tables: batched, idempotent, restartable.
6. Each migration is verified against a copy of production-shaped data before deploy.

## Queries

- All queries live in `infrastructure/` of the owning module.
- No raw SQL in `domain/` or `application/`.
- Parameterized queries only. No string concatenation.
- Long queries are stored as named SQL files alongside their adapter when readability suffers.

## Transactions

- Use-cases that mutate more than one entity use a transaction.
- The transaction boundary is opened in the use-case, not in the repository.
- Long-running work does not run inside a transaction.

## Phase-1 core schema (intent)

The exact Prisma schema is generated from the `database` agent's review. The conceptual tables:

- `accounts` — internal accounts; `id ulid pk`, `external_account_name text`, `discord_user_id text null unique`, `status text`, timestamps.
- `licenses` — `id ulid pk`, `status text`, `expires_at timestamptz`, `max_activations int`, `current_activations int`, `created_by text`, timestamps.
- `activation_codes` — `id ulid pk`, `code text unique`, `license_id ulid fk`, `redeemed_at timestamptz null`, `redeemed_by_account_id ulid null fk`, timestamps.
- `automation_sessions` — `id ulid pk`, `account_id ulid fk`, `state text`, `started_at timestamptz null`, `stopped_at timestamptz null`, timestamps.
- `audit_logs` — see below.

## Audit table

- Append-only at the DB level (DB role for the app has no `UPDATE`/`DELETE` on `audit_logs`).
- Schema:
  - `id ulid pk`
  - `created_at timestamptz`
  - `actor text` (Discord user id, or `system`)
  - `action text` (e.g., `license.redeem`, `session.start`)
  - `target_type text`
  - `target_id text`
  - `correlation_id text`
  - `payload jsonb` (no secrets)

## Forbidden

- `DROP COLUMN` in the same release that stops using it.
- Adding `NOT NULL` to existing columns without backfill.
- Using natural keys (Discord ID) as primary keys of internal tables.
- Storing comma-separated lists in `text`.
- Querying across module boundaries via SQL joins. Cross-module access goes through application ports.

## Enforcement

- `database` agent reviews every migration.
- CI runs migrations up and down against a fresh DB.
- CI runs a schema-diff check against the previous tag.
