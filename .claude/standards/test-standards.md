# Test Standards

The full rule set is in `../rules/testing-rules.md`. This file documents the **how** — conventions and snippets — so contributors do not reinvent shape per file.

## Tooling

- Test runner: Vitest.
- Assertion style: built-in `expect`.
- Fakes: hand-rolled in-memory adapters under `<module>/infrastructure/in-memory/`.
- Mock library: avoid; prefer in-memory implementations of ports.

## File layout

- `foo.ts` → `foo.test.ts` (unit).
- `<module>/application/<use-case>.ts` → `<use-case>.int.test.ts` (integration).
- `src/discord/commands/<command>/<command>.handler.ts` → `<command>.handler.test.ts`.
- E2E suite: `tests/e2e/*.e2e.test.ts`.

## Patterns

### Unit test (pure domain)

```ts
import { describe, it, expect } from 'vitest';
import { redeemActivationCode } from './redeem-activation-code';

describe('redeemActivationCode', () => {
  it('marks the license active and decrements available activations', () => {
    const code = makeActivationCode({ uses: 1 });
    const license = makeLicense({ maxActivations: 1, currentActivations: 0 });

    const result = redeemActivationCode({ code, license, now: T0 });

    expect(result.license.status).toBe('active');
    expect(result.license.currentActivations).toBe(1);
    expect(result.code.redeemedAt).toEqual(T0);
  });

  it('rejects when license is expired', () => {
    const code = makeActivationCode({ uses: 1 });
    const license = makeLicense({ expiresAt: T0_MINUS_1H });

    expect(() => redeemActivationCode({ code, license, now: T0 }))
      .toThrowError(LicenseExpiredError);
  });
});
```

### Integration test (use-case + in-memory adapters)

```ts
describe('InitAccount use-case', () => {
  it('binds a Discord user to an account and emits an audit event', async () => {
    const ctx = makeTestContext(); // wires in-memory repos + clock + ids
    await ctx.seedLicenseWithCode({ code: 'ABCD-EFGH' });

    const result = await ctx.useCases.initAccount.run({
      discordUserId: 'd-123',
      activationCode: 'ABCD-EFGH',
    });

    expect(result.ok).toBe(true);
    expect(ctx.audit.events).toContainEqual(
      expect.objectContaining({ action: 'account.linked', actor: 'd-123' }),
    );
  });
});
```

### Handler test

```ts
describe('/init handler', () => {
  it('calls initAccount with parsed code and replies ephemerally', async () => {
    const useCase = vi.fn().mockResolvedValue({ ok: true });
    const interaction = makeFakeInteraction({
      commandName: 'init',
      options: { code: 'ABCD-EFGH' },
    });

    await initHandler(interaction, { useCases: { initAccount: { run: useCase } } });

    expect(useCase).toHaveBeenCalledWith({ discordUserId: '...', activationCode: 'ABCD-EFGH' });
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ ephemeral: true }),
    );
  });
});
```

## Determinism helpers

- Injected `Clock` (`now(): Date`) — tests use a fixed clock.
- Injected `IdGenerator` (`new(): Id`) — tests use a deterministic sequence.
- Fake timers (`vi.useFakeTimers`) for time-dependent code.

## Coverage philosophy

- We do **not** chase coverage numbers.
- We **do** require coverage of every domain rule, every state transition, and every bug fix.
- Reviewers ask: "if this rule changed silently, would a test fail?"

## Anti-patterns (also in `../rules/testing-rules.md`)

- Snapshot tests against IDs, timestamps, or insertion order.
- Mocking the thing under test.
- Tests asserting private internals.
- `.skip` without issue link + removal date.
- Tests that share writable state.
