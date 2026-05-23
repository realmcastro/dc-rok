import type { CorrelationId } from '../../shared/index.js';

/**
 * Append-only audit record. ADR-0013: the DB role prevents UPDATE/DELETE.
 *
 * `payload` MUST NOT contain secrets (license keys, activation codes, tokens).
 * See security-rules.md.
 */
export interface AuditEvent {
  readonly id: string;
  readonly createdAt: Date;
  /** Discord user id of the actor, or the literal "system". */
  readonly actor: string;
  /** Dotted action name, e.g. "license.redeem", "account.link", "session.start". */
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly correlationId: CorrelationId;
  readonly payload: Readonly<Record<string, unknown>>;
}

export const SYSTEM_ACTOR = 'system';
