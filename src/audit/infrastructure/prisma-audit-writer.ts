import type { Prisma, PrismaClient } from '@prisma/client';

import type { Clock, IdGenerator } from '../../shared/index.js';
import type { AuditWriter, RecordAuditInput } from '../application/ports/audit-writer.js';

type PrismaAuditClient = PrismaClient | Prisma.TransactionClient;

export class PrismaAuditWriter implements AuditWriter {
  constructor(
    private readonly db: PrismaAuditClient,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async record(input: RecordAuditInput): Promise<void> {
    await (this.db as PrismaClient).auditLog.create({
      data: {
        id: this.ids.next(),
        createdAt: this.clock.now(),
        actor: input.actor,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        correlationId: input.correlationId,
        payload: input.payload as Prisma.InputJsonValue,
      },
    });
  }
}
