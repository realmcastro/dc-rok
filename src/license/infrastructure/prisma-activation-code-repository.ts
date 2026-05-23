import type { Prisma, PrismaClient } from '@prisma/client';

import type { ActivationCodeRepository } from '../application/ports/activation-code-repository.js';
import { ActivationCode, type ActivationCodeSnapshot } from '../domain/activation-code.js';
import {
  asActivationCodeId,
  asLicenseId,
  type ActivationCodeId,
  type LicenseId,
} from '../domain/license-id.js';

type PrismaCodeClient = PrismaClient | Prisma.TransactionClient;

interface PrismaCodeRow {
  id: string;
  codeHash: string;
  licenseId: string;
  redeemedAt: Date | null;
  redeemedByAccountId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toDomain(row: PrismaCodeRow): ActivationCode {
  return ActivationCode.fromSnapshot({
    id: asActivationCodeId(row.id),
    codeHash: row.codeHash,
    licenseId: asLicenseId(row.licenseId),
    redeemedAt: row.redeemedAt,
    redeemedByAccountId: row.redeemedByAccountId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export class PrismaActivationCodeRepository implements ActivationCodeRepository {
  constructor(private readonly db: PrismaCodeClient) {}

  async findById(id: ActivationCodeId): Promise<ActivationCode | null> {
    const row = await (this.db as PrismaClient).activationCode.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByCodeHash(codeHash: string): Promise<ActivationCode | null> {
    const row = await (this.db as PrismaClient).activationCode.findUnique({
      where: { codeHash },
    });
    return row ? toDomain(row) : null;
  }

  async findByLicense(licenseId: LicenseId): Promise<ActivationCode[]> {
    const rows = await (this.db as PrismaClient).activationCode.findMany({
      where: { licenseId },
    });
    return rows.map(toDomain);
  }

  async findRedeemedByAccount(accountId: string): Promise<ActivationCode[]> {
    const rows = await (this.db as PrismaClient).activationCode.findMany({
      where: { redeemedByAccountId: accountId },
      orderBy: { redeemedAt: 'desc' },
    });
    return rows.map(toDomain);
  }

  async save(code: ActivationCode): Promise<void> {
    const s: ActivationCodeSnapshot = code.toSnapshot();
    await (this.db as PrismaClient).activationCode.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        codeHash: s.codeHash,
        licenseId: s.licenseId,
        redeemedAt: s.redeemedAt,
        redeemedByAccountId: s.redeemedByAccountId,
      },
      update: {
        redeemedAt: s.redeemedAt,
        redeemedByAccountId: s.redeemedByAccountId,
      },
    });
  }
}
