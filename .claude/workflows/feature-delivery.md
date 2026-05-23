# Feature Delivery Workflow

Every feature, however small, follows these eight steps. Skipping a step requires an ADR.

## Steps

### 1. Understanding

- Read the request as written. Restate it in one paragraph in your own words.
- Identify the **Phase-1 outcome** it serves (see `../context/project-vision.md`). If none, route to `scope-enforcer`.
- Identify the **users** affected (end user, admin, system).

### 2. Architectural impact

- Which modules does this touch?
- Does it cross module boundaries? If yes, what new ports are needed?
- Does it change dependency direction? If yes, **stop** — write an ADR.
- Does it touch Phase-2 seams? If yes, **stop** — `scope-enforcer` veto.

### 3. Domain modeling

- Update or add entities, value objects, and state transitions in `domain/`.
- Encode invariants in types. Don't accept "string" where a branded type is appropriate.
- Add unit tests for the domain rules **first**.

### 4. Schema impact

- Does this require a schema change? If yes:
  - Open `database-change-process.md` and follow it.
  - Add the Prisma model change and the migration in the same PR.
- If no schema change, document why in the PR description.

### 5. Tests

- Write tests at the lowest level that proves the rule.
- Add an integration test for any new use-case.
- Add a handler test for any new slash command.
- For bug fixes: failing regression test **first**, then the fix.

### 6. Implementation

- Implement the smallest change that makes the tests pass.
- Follow `../rules/coding-rules.md`, `../rules/naming-rules.md`, `../rules/logging-rules.md`.
- Keep the diff focused. No drive-by refactors.

### 7. Review

- Run `npm run check` locally. Must be green.
- Self-review against `review-checklist.md`.
- Open the PR. The relevant specialist agent(s) review per `agents/README.md`.

### 8. Validation

- Manual smoke test for any user-facing change (run the bot locally, exercise the command).
- Verify the audit log received the expected entry.
- Verify the embed renders correctly.
- Tick off `../standards/definition-of-done.md`.

## When to break the workflow

- Critical security fix: shortcut to steps 5 → 6 → 7 (test + fix + review). Document in PR description.
- Prototype under `experiments/`: only step 1. The prototype cannot ship to `main`.

## Anti-shortcuts

- "Just commit and clean up later" — no.
- "Tests can come in a follow-up" — no.
- "I'll add the migration next PR" — no. Schema and code change land together.
