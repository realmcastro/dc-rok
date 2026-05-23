import type { CorrelationId } from '../../../shared/index.js';

export interface RecordAuditInput {
  readonly actor: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly correlationId: CorrelationId;
  readonly payload: Readonly<Record<string, unknown>>;
}

/**
 * Append-only write port for audit events.
 *
 * Implementations MUST be safe to call inside a caller-owned transaction so
 * the audit insert is atomic with the business write that triggered it.
 */
export interface AuditWriter {
  record(input: RecordAuditInput): Promise<void>;
}
