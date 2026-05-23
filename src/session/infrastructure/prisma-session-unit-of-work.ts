import type { PrismaClient } from '@prisma/client';

import { PrismaAuditWriter } from '../../audit/index.js';
import {
  PrismaActivationCodeRepository,
  PrismaLicenseRepository,
} from '../../license/index.js';
import type { Clock, IdGenerator } from '../../shared/index.js';
import type {
  SessionTxContext,
  SessionUnitOfWork,
} from '../application/ports/session-unit-of-work.js';
import { PrismaSessionRepository } from './prisma-session-repository.js';

export class PrismaSessionUnitOfWork implements SessionUnitOfWork {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async run<T>(callback: (tx: SessionTxContext) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(async (tx) => {
      const ctx: SessionTxContext = {
        sessions: new PrismaSessionRepository(tx),
        licenses: new PrismaLicenseRepository(tx),
        codes: new PrismaActivationCodeRepository(tx),
        audit: new PrismaAuditWriter(tx, this.ids, this.clock),
      };
      return callback(ctx);
    });
  }
}
