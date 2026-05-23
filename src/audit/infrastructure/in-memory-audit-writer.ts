import type { Clock, IdGenerator } from '../../shared/index.js';
import type { AuditWriter, RecordAuditInput } from '../application/ports/audit-writer.js';
import type { AuditEvent } from '../domain/audit-event.js';

export class InMemoryAuditWriter implements AuditWriter {
  readonly entries: AuditEvent[] = [];

  constructor(
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  record(input: RecordAuditInput): Promise<void> {
    this.entries.push({
      id: this.ids.next(),
      createdAt: this.clock.now(),
      actor: input.actor,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      correlationId: input.correlationId,
      payload: input.payload,
    });
    return Promise.resolve();
  }
}
