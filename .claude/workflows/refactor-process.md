# Refactor Process

Refactors must change structure without changing behavior. If behavior changes, it is a feature or a bugfix — not a refactor.

## When to refactor

- Three concrete cases of duplication exist.
- A module has grown past its single responsibility.
- A test is hard to write because of a structural problem.
- An ADR mandates a structural change.

## When NOT to refactor

- "It looks nicer this way" — not enough.
- "We might want this abstraction later" — not enough.
- "I read about a pattern" — not enough.
- Inside a bugfix PR — not allowed.

## Steps

### 1. Define the structural goal

- Write the goal in one sentence in the PR description.
- Identify the rule it serves (`architecture-rules.md`, `naming-rules.md`, etc.).
- If no rule is served and no duplication is collapsed, **stop**.

### 2. Snapshot behavior

- Identify the tests that already cover the affected code. Run them; they must be green.
- If coverage is thin, **add tests first** as a separate commit, then refactor.

### 3. Refactor in small steps

- Each commit leaves the suite green.
- Prefer many small commits over one huge one.
- Use IDE refactoring tools (extract, rename) where possible.

### 4. Verify no behavior change

- All existing tests still pass without modification.
- If a test had to change, you are not refactoring — stop and reconsider.

### 5. Update governance

- If the refactor changes module boundaries, update `../rules/architecture-rules.md` and write an ADR.
- If it changes naming conventions, update `../rules/naming-rules.md`.

### 6. Mark debt cleared

- If the refactor was filed in `../memory/technical-debt.md`, mark it cleared with a link to the PR.

## Anti-patterns

- Refactoring to "prepare for an upcoming feature" the same PR will add. Split into two PRs.
- Renaming without updating call sites in the same PR.
- Refactoring tests and code simultaneously — refactor one, run, then the other.
- Deleting tests that "feel obsolete" mid-refactor.
