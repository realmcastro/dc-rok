# Database Change Process

Every schema change is permanent. Treat it like a contract change.

## Step 0 — Decide if a change is needed

- Can the requirement be satisfied without a schema change? (Often yes.)
- If yes, do not change the schema. Use existing columns and a typed mapping.

## Step 1 — Write the proposal

Add a short proposal to the PR description with:

1. The new or modified tables/columns.
2. The query patterns they enable.
3. Indexes required.
4. Forward migration plan (steps).
5. Backward / rollback plan (or explicit forward-fix plan).
6. Backfill plan, if any.

## Step 2 — Update `prisma/schema.prisma`

- Add/modify models.
- Add explicit `@map` and `@@map` to keep snake_case in DB.
- Add indexes (`@@index`) for new query patterns.

## Step 3 — Generate the migration

- `npx prisma migrate dev --name <verb_subject>` (e.g., `add_activation_codes`).
- Inspect the generated SQL. Edit if necessary (e.g., for backfill steps).
- Add a comment at the top of the SQL file referencing the PR.

## Step 4 — Backfill (if needed)

- Backfills are **idempotent** and **restartable**.
- Large backfills run in batches, with progress logged.
- For Phase-1 scale, in-migration backfill is acceptable. For larger sets, write a one-off script under `scripts/`.

## Step 5 — Code changes

- Update repositories in the relevant `infrastructure/`.
- Update use-cases and domain types if needed.
- Update tests.

## Step 6 — Verify locally

- Drop and re-create the dev DB: `npm run db:reset`.
- Re-run all migrations from scratch. They must apply cleanly.
- Run the full test suite. Green.

## Step 7 — Review

- `database` agent reviews the SQL and the schema diff.
- `system-architect` reviews any cross-module impact.

## Step 8 — Deploy

- Migrations run on deploy via `npx prisma migrate deploy`.
- The deploy is blocking: if the migration fails, the release is rolled back.

## Destructive changes (two-phase)

Any destructive change (drop column, drop table, drop constraint) is two-release:

- Release N: stop reading/writing the column. Code no longer references it.
- Release N+1 (after the previous deploy is stable and backups verified): drop.

A destructive change in one release is rejected.

## Renames (multi-phase)

Renaming a column or table is **never** done in place:

1. Add new column/table.
2. Backfill from old.
3. Read from new (writes still go to both).
4. Stop writing to old.
5. Drop old (separate release).

## Forbidden

- Editing an applied migration.
- Reusing a migration timestamp.
- `prisma db push` against any environment other than your local dev DB.
- Skipping the backup-verification step before a destructive change.

## Enforcement

- CI runs migrations up against a fresh DB on every PR.
- `database` agent reviews every PR with changes under `prisma/`.
