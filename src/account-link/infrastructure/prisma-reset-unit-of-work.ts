import type { PrismaClient } from '@prisma/client';

import { PrismaAuditWriter } from '../../audit/index.js';
import { PrismaSessionRepository } from '../../session/index.js';
import type { Clock, IdGenerator } from '../../shared/index.js';
import type { ResetTxContext, ResetUnitOfWork } from '../application/ports/reset-unit-of-work.js';

import { PrismaAccountRepository } from './prisma-account-repository.js';

export class PrismaResetUnitOfWork implements ResetUnitOfWork {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async run<T>(callback: (tx: ResetTxContext) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(async (tx) => {
      const ctx: ResetTxContext = {
        accounts: new PrismaAccountRepository(tx),
        sessions: new PrismaSessionRepository(tx),
        audit: new PrismaAuditWriter(tx, this.ids, this.clock),
      };
      return callback(ctx);
    });
  }
}
