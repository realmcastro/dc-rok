import type { Prisma, PrismaClient } from '@prisma/client';

import type { LicenseRepository } from '../application/ports/license-repository.js';
import { asLicenseId, type LicenseId } from '../domain/license-id.js';
import { License, type LicenseSnapshot, type LicenseStatus } from '../domain/license.js';

type PrismaLicenseClient =
  | PrismaClient
  | Prisma.TransactionClient
  | { license: PrismaClient['license'] };

interface PrismaLicenseRow {
  id: string;
  keyHash: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  expiresAt: Date;
  maxActivations: number;
  currentActivations: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

function toDomain(row: PrismaLicenseRow): License {
  return License.fromSnapshot({
    id: asLicenseId(row.id),
    keyHash: row.keyHash,
    status: row.status satisfies LicenseStatus,
    expiresAt: row.expiresAt,
    maxActivations: row.maxActivations,
    currentActivations: row.currentActivations,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export class PrismaLicenseRepository implements LicenseRepository {
  constructor(private readonly db: PrismaLicenseClient) {}

  async findById(id: LicenseId): Promise<License | null> {
    const row = await (this.db as PrismaClient).license.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByKeyHash(keyHash: string): Promise<License | null> {
    const row = await (this.db as PrismaClient).license.findUnique({ where: { keyHash } });
    return row ? toDomain(row) : null;
  }

  async save(license: License): Promise<void> {
    const s: LicenseSnapshot = license.toSnapshot();
    await (this.db as PrismaClient).license.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        keyHash: s.keyHash,
        status: s.status,
        expiresAt: s.expiresAt,
        maxActivations: s.maxActivations,
        currentActivations: s.currentActivations,
        createdBy: s.createdBy,
      },
      update: {
        status: s.status,
        expiresAt: s.expiresAt,
        maxActivations: s.maxActivations,
        currentActivations: s.currentActivations,
      },
    });
  }
}
