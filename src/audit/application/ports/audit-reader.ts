import type { CorrelationId } from '../../../shared/index.js';
import type { AuditEvent } from '../../domain/audit-event.js';

export interface AuditReader {
  byCorrelationId(id: CorrelationId): Promise<AuditEvent[]>;
  byActor(actor: string, limit?: number): Promise<AuditEvent[]>;
}
