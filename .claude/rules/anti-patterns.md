# Anti-patterns

Forbidden patterns across the codebase. If you find yourself reaching for one of these, stop and discuss in an ADR.

## Architecture

- **God service**: a class accumulating unrelated responsibilities. Split by domain concept.
- **Anemic domain**: entities are data bags and "services" hold all behavior. Push behavior to where the invariants live.
- **Layer-skipping**: Discord handler → DB directly. Always go through application.
- **Bidirectional dependencies between modules**: implies a missing third concept.
- **Premature abstraction**: `BaseRepository<T>` before a second concrete repository exists.
- **Configurability theatre**: options nobody uses, gated behind env vars.
- **Stubbed Phase-2 features**: live placeholders that "almost work". Phase-2 seams must be empty no-ops.

## Code

- **`any` to make TypeScript shut up**: use `unknown` and narrow.
- **`as` cast at I/O boundary**: parse with a validator.
- **String-typed state**: `'pending' | 'active' | 'expired'` as a string union without a parser. Use a branded type and constructor.
- **Boolean explosion**: `isActive`, `isExpired`, `isPending` instead of a discriminated state.
- **Hidden mutation**: a "getter" that mutates state.
- **Long parameter lists**: ≥ 3 positional args of similar types. Pass an object.
- **Dead code branches "for safety"**: defensive checks that can never be true. Trust your types.

## Async

- **Swallowed promise**: `someAsync()` without `await` and without an explicit fire-and-forget comment.
- **Sequential `await` where `Promise.all` is correct** (and vice versa).
- **`setInterval` without cleanup**.
- **No timeout on outbound calls**.

## Errors

- **Try/catch/ignore**: `catch { /* nothing */ }`.
- **Throwing strings or raw `Error`** in business code.
- **Returning `null` for failure** where a discriminated result is clearer.
- **Hidden retries**: silently retrying with no backoff and no visibility.

## Discord

- **Logic in handler**: > 50 lines of branching in a handler. Move to a use-case.
- **DB call from handler**.
- **Public reply containing private data**.
- **`MessageContent` intent**.
- **Polling Discord** for state already pushed via gateway.

## Database

- **Renaming a column in one migration**.
- **`DROP COLUMN` in the same release that stops using it**.
- **JSONB as schema-design avoidance**.
- **Natural keys as PKs** (Discord IDs as the PK of internal tables).
- **Cross-module SQL joins**: cross-module access goes through application ports.

## Security

- **Secret read outside `src/config/`**.
- **String-concatenated SQL**.
- **Logging full interaction payload**.
- **License key in any non-ephemeral, non-issuing-user reply**.
- **Skipping audit "for simplicity"**.

## Testing

- **Mock of the thing under test**.
- **Snapshot of volatile data**.
- **`.skip` with no link and no date**.
- **Asserting private internals**.
- **Tests that share writable state across files**.

## Process

- **Edit applied migrations**.
- **Land a fix without a regression test**.
- **Bypass `npm run check` with `--no-verify`**.
- **Land a Phase-2 capability under a different name**.

If a pattern not listed here feels wrong, write an ADR proposing it for this list.
