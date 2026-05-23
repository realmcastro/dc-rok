/**
 * Discriminated result type for use-cases that prefer returning failure over throwing.
 *
 * Use when:
 *   - the failure is part of the contract (e.g. validation outcomes), and
 *   - the caller will fan out to multiple presenters per outcome.
 *
 * Throw typed errors when the failure is exceptional. Don't use both for the same call.
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
