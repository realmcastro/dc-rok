# Bugfix Process

A bug is a violation of an existing invariant. Fixing it without recording the invariant in a test is forbidden.

## Steps

### 1. Reproduce

- Reproduce the bug locally. If you cannot reproduce, stop and gather more information.
- Capture the **smallest** reproduction case.

### 2. Write the failing test

- Add a test (unit, integration, or handler) that fails for the bug and would pass after the fix.
- Commit this test in isolation. The CI run on this commit must show a red on the new test only.
- Naming: `it('does not <break>', ...)` — describe the invariant, not the bug.

### 3. Identify root cause

- Use `git blame` and the code itself. Do not guess from symptoms.
- If the cause is in another module, route to that module's specialist agent for the fix.

### 4. Fix at root

- Fix the underlying invariant, not the symptom.
- Avoid wrapping the symptom in a try/catch. Fix the cause.
- If the fix exposes more bugs, file them as separate issues.

### 5. Verify

- The previously-failing test now passes.
- The rest of the suite is still green.
- Run `npm run check`.

### 6. Audit & logging

- If the bug masked an audit-relevant event, decide whether to backfill.
- If logs were misleading, improve them in the same PR.

### 7. Post-mortem (for significant bugs)

- Add an entry in `../memory/known-risks.md` if the class of bug could recur.
- If the fix changes a rule, update the relevant `.claude/rules/` file in the same PR.

## Anti-patterns

- Deleting the test that caught the bug.
- "Fixing" via a config knob without addressing the cause.
- Re-introducing the bug by reverting the test in a later PR.
- Bundling unrelated cleanup into a bugfix PR.
