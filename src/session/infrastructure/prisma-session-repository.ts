import type { Prisma, PrismaClient } from '@prisma/client';

import type { SessionRepository } from '../application/ports/session-repository.js';
import {
  AutomationSession,
  type AutomationSessionSnapshot,
  type SessionState,
} from '../domain/automation-session.js';
import { asSessionId, type SessionId } from '../domain/session-id.js';

type PrismaSessionClient = PrismaClient | Prisma.TransactionClient;

interface PrismaSessionRow {
  id: string;
  accountId: string;
  state: 'IDLE' | 'ACTIVE' | 'STOPPED';
  startedAt: Date | null;
  stoppedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function toDomain(row: PrismaSessionRow): AutomationSession {
  return AutomationSession.fromSnapshot({
    id: asSessionId(row.id),
    accountId: row.accountId,
    state: row.state satisfies SessionState,
    startedAt: row.startedAt,
    stoppedAt: row.stoppedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly db: PrismaSessionClient) {}

  async findById(id: SessionId): Promise<AutomationSession | null> {
    const row = await (this.db as PrismaClient).automationSession.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByAccountId(accountId: string): Promise<AutomationSession | null> {
    const row = await (this.db as PrismaClient).automationSession.findUnique({
      where: { accountId },
    });
    return row ? toDomain(row) : null;
  }

  async save(session: AutomationSession): Promise<void> {
    const s: AutomationSessionSnapshot = session.toSnapshot();
    await (this.db as PrismaClient).automationSession.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        accountId: s.accountId,
        state: s.state,
        startedAt: s.startedAt,
        stoppedAt: s.stoppedAt,
      },
      update: {
        state: s.state,
        startedAt: s.startedAt,
        stoppedAt: s.stoppedAt,
      },
    });
  }
}
