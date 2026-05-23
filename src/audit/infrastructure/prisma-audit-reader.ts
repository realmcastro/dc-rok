import type { PrismaClient } from '@prisma/client';

import { asCorrelationId, type CorrelationId } from '../../shared/index.js';
import type { AuditReader } from '../application/ports/audit-reader.js';
import type { AuditEvent } from '../domain/audit-event.js';

interface AuditRow {
  id: string;
  createdAt: Date;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  correlationId: string;
  payload: unknown;
}

function toDomain(row: AuditRow): AuditEvent {
  return {
    id: row.id,
    createdAt: row.createdAt,
    actor: row.actor,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    correlationId: asCorrelationId(row.correlationId),
    payload: row.payload as Readonly<Record<string, unknown>>,
  };
}

export class PrismaAuditReader implements AuditReader {
  constructor(private readonly db: PrismaClient) {}

  async byCorrelationId(id: CorrelationId): Promise<AuditEvent[]> {
    const rows = await this.db.auditLog.findMany({
      where: { correlationId: id },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toDomain);
  }

  async byActor(actor: string, limit = 50): Promise<AuditEvent[]> {
    const rows = await this.db.auditLog.findMany({
      where: { actor },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(toDomain);
  }
}
