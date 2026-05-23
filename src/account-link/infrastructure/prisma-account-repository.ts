import type { Prisma, PrismaClient } from '@prisma/client';

import {
  asAccountId,
  parseDiscordUserId,
  type AccountId,
  type DiscordUserId,
} from '../domain/account-id.js';
import { Account, type AccountSnapshot, type AccountStatus } from '../domain/account.js';
import type { AccountRepository } from '../application/ports/account-repository.js';

type PrismaAccountClient = PrismaClient | Prisma.TransactionClient;

interface PrismaAccountRow {
  id: string;
  externalAccountName: string;
  discordUserId: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'UNLINKED';
  createdAt: Date;
  updatedAt: Date;
}

function toDomain(row: PrismaAccountRow): Account {
  return Account.fromSnapshot({
    id: asAccountId(row.id),
    externalAccountName: row.externalAccountName,
    discordUserId: row.discordUserId === null ? null : parseDiscordUserId(row.discordUserId),
    status: row.status satisfies AccountStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly db: PrismaAccountClient) {}

  async findById(id: AccountId): Promise<Account | null> {
    const row = await (this.db as PrismaClient).account.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByDiscordUserId(discordUserId: DiscordUserId): Promise<Account | null> {
    const row = await (this.db as PrismaClient).account.findUnique({ where: { discordUserId } });
    return row ? toDomain(row) : null;
  }

  async save(account: Account): Promise<void> {
    const s: AccountSnapshot = account.toSnapshot();
    await (this.db as PrismaClient).account.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        externalAccountName: s.externalAccountName,
        discordUserId: s.discordUserId,
        status: s.status,
      },
      update: {
        externalAccountName: s.externalAccountName,
        discordUserId: s.discordUserId,
        status: s.status,
      },
    });
  }
}
