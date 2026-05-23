import type { PrismaClient } from '@prisma/client';

import { PrismaAuditWriter } from '../../audit/index.js';
import { PrismaActivationCodeRepository, PrismaLicenseRepository } from '../../license/index.js';
import type { Clock, IdGenerator } from '../../shared/index.js';
import type { LinkTxContext, LinkUnitOfWork } from '../application/ports/link-unit-of-work.js';

import { PrismaAccountRepository } from './prisma-account-repository.js';

/**
 * The single sanctioned place where Prisma adapters from `account-link`,
 * `license`, and `audit` are constructed together. Lives in `account-link/`
 * because account-link owns the cross-module flows that need this composition.
 */
export class PrismaLinkUnitOfWork implements LinkUnitOfWork {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async run<T>(callback: (tx: LinkTxContext) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(async (tx) => {
      const ctx: LinkTxContext = {
        accounts: new PrismaAccountRepository(tx),
        licenses: new PrismaLicenseRepository(tx),
        codes: new PrismaActivationCodeRepository(tx),
        audit: new PrismaAuditWriter(tx, this.ids, this.clock),
      };
      return callback(ctx);
    });
  }
}
