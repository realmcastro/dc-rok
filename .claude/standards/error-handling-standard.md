# Error Handling Standard

Errors are first-class. Every error is **typed**, **logged**, and **either handled or rethrown to a known boundary**.

## Error hierarchy

```
AppError (abstract)
 ├── DomainError              business-rule violations
 │    ├── LicenseExpiredError
 │    ├── ActivationCodeAlreadyRedeemedError
 │    ├── AccountAlreadyLinkedError
 │    ├── ActiveSessionExistsError
 │    └── …
 ├── ValidationError          input did not parse (Zod)
 ├── InfrastructureError      DB/network/Discord/system
 │    ├── DatabaseError
 │    ├── DiscordApiError
 │    └── TimeoutError
 └── ConfigError              startup-time misconfiguration
```

All defined in `src/shared/domain/errors.ts` (domain) and `src/shared/infrastructure/errors.ts` (infra). Module-specific subclasses live in the module's `domain/`.

## Rules

1. Every thrown value is an `AppError` subclass. Never `throw 'string'`, never `throw new Error('x')` in business code.
2. Every `catch` either **handles** the error (and logs) or **rethrows** (and does not log to avoid duplication).
3. Catch-all at boundaries only:
   - Discord interaction boundary → friendly embed with correlation id.
   - Background task boundary → log + safe shutdown of the task.
   - Process top-level → `fatal` log + graceful exit.
4. Every I/O call has a timeout (`withTimeout`).
5. Domain errors are **expected**; they map to user-friendly embeds with stable codes.
6. Infrastructure errors are **unexpected**; they map to a generic "try again" embed and a `error`-level log with stack.

## Discord boundary mapping

```ts
async function replyError(interaction, err, correlationId) {
  if (err instanceof DomainError) {
    await interaction.reply({
      embeds: [errorEmbed(err.code, err.userMessage, correlationId)],
      ephemeral: true,
    });
    return;
  }
  if (err instanceof ValidationError) {
    await interaction.reply({
      embeds: [errorEmbed('INVALID_INPUT', err.userMessage, correlationId)],
      ephemeral: true,
    });
    return;
  }
  await interaction.reply({
    embeds: [errorEmbed('INTERNAL', 'Something went wrong. Please try again.', correlationId)],
    ephemeral: true,
  });
}
```

## Timeouts

```ts
export async function withTimeout<T>(
  fn: () => Promise<T>,
  opts: { ms: number; op: string; correlationId: string },
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new TimeoutError({ op: opts.op, ms: opts.ms, correlationId: opts.correlationId })),
          opts.ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
```

Every outbound call uses this.

## Retries

- Default: no retry. Surface the error.
- When retry is justified (idempotent operation, transient failure class), use exponential backoff with a cap and a maximum total time.
- Every retry logged at `debug`; final failure at `warn` or `error`.

## Domain error contract

Each `DomainError` carries:

- `code` — stable string (`LICENSE_EXPIRED`, `CODE_ALREADY_REDEEMED`, …) used in audit + embed.
- `userMessage` — safe-to-display string. No internal details.
- `meta` — structured object for logs. No secrets.

The set of codes is documented in `../context/glossary.md` once a code is added.

## Forbidden

- `catch (e) { /* ignore */ }`.
- `console.error(e)` in `src/`.
- `throw e.message` (loses type).
- Wrapping a domain error in an infra error to "make it shut up".
- Catching at random function boundaries "just in case".

## Enforcement

- `backend-reliability` agent reviews error paths in PRs touching I/O or async.
- Lint rule disallows `throw new Error(` outside `bootstrap/` and `shared/`.
