import type { PrismaClient } from '@prisma/client';

import type { LicenseTxContext, LicenseUnitOfWork } from '../application/ports/unit-of-work.js';

import { PrismaActivationCodeRepository } from './prisma-activation-code-repository.js';
import { PrismaLicenseRepository } from './prisma-license-repository.js';

export class PrismaLicenseUnitOfWork implements LicenseUnitOfWork {
  constructor(private readonly prisma: PrismaClient) {}

  async run<T>(callback: (tx: LicenseTxContext) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(async (tx) => {
      const ctx: LicenseTxContext = {
        licenses: new PrismaLicenseRepository(tx),
        codes: new PrismaActivationCodeRepository(tx),
      };
      return callback(ctx);
    });
  }
}
