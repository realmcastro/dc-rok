/**
 * Base classes for typed errors. See coding-rules.md and anti-patterns.md.
 *
 * Throw only typed errors in business code. Never throw strings or raw Error.
 */

export abstract class AppError extends Error {
  abstract readonly kind: 'domain' | 'infrastructure';
  abstract readonly code: string;

  readonly metadata: Readonly<Record<string, unknown>>;

  constructor(message: string, options?: { cause?: unknown; metadata?: Record<string, unknown> }) {
    super(message);
    this.name = this.constructor.name;
    this.metadata = Object.freeze({ ...(options?.metadata ?? {}) });
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

/**
 * A rule of the domain was violated. The caller can usually translate this
 * to a user-facing message.
 */
export abstract class DomainError extends AppError {
  readonly kind = 'domain' as const;
}

/**
 * The outside world failed (DB unreachable, Discord 5xx, etc.). The caller
 * should log + (optionally) retry, but not expose details to end users.
 */
export abstract class InfrastructureError extends AppError {
  readonly kind = 'infrastructure' as const;
}

// ---- Common concrete errors -----------------------------------------------

export class InvalidInputError extends DomainError {
  readonly code = 'INVALID_INPUT';
}

export class NotFoundError extends DomainError {
  readonly code: string = 'NOT_FOUND';
}

export class ConflictError extends DomainError {
  readonly code: string = 'CONFLICT';
}

export class PermissionDeniedError extends DomainError {
  readonly code = 'PERMISSION_DENIED';
}

export class RateLimitedError extends DomainError {
  readonly code = 'RATE_LIMITED';
}

export class DependencyError extends InfrastructureError {
  readonly code = 'DEPENDENCY_FAILURE';
}

export class TimeoutError extends InfrastructureError {
  readonly code = 'TIMEOUT';
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}
