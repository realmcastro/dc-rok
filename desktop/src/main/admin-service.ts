import { createHmac, randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';
import type {
  AccountRow,
  ActivationCodeRow,
  DashboardStats,
  EnvSummary,
  LicenseRow,
  SessionRow,
} from '@shared/ipc-contract';

/**
 * Admin service. Reads + writes operational data via Prisma. The bot remains
 * the runtime authority for user-initiated flows (/init, /start, /stop);
 * this layer serves the admin panel.
 *
 * Where reuse of the existing TS use cases would help (e.g. IssueLicense),
 * we mirror the same hashing rules here so admin issuance produces records
 * the bot can later verify. The HMAC pepper is the same value loaded from
 * the project's .env.
 */
export class AdminService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly pepper: string,
  ) {}

  // ---- dashboard ----

  async dashboard(backendStatus: DashboardStats['backend']): Promise<DashboardStats> {
    const dbHealth = await this.dbHealth();
    const [activeSessions, expiredLicenses, linkedAccounts] = await Promise.all([
      this.prisma.automationSession.count({ where: { state: 'ACTIVE' } }),
      this.prisma.license.count({
        where: { OR: [{ status: 'EXPIRED' }, { expiresAt: { lt: new Date() } }] },
      }),
      this.prisma.account.count({ where: { status: 'ACTIVE' } }),
    ]);
    return { backend: backendStatus, dbHealth, activeSessions, expiredLicenses, linkedAccounts };
  }

  async dbHealth(): Promise<{ ok: boolean; latencyMs: number | null; error: string | null }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      return { ok: true, latencyMs: Date.now() - start, error: null };
    } catch (err) {
      return {
        ok: false,
        latencyMs: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // ---- licenses ----

  async listLicenses(filter?: { status?: string; search?: string }): Promise<LicenseRow[]> {
    const where: Record<string, unknown> = {};
    if (filter?.status && filter.status !== 'ALL') where['status'] = filter.status;
    if (filter?.search) where['id'] = { contains: filter.search.toUpperCase() };
    const rows = await this.prisma.license.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      expiresAt: r.expiresAt.toISOString(),
      maxActivations: r.maxActivations,
      currentActivations: r.currentActivations,
      createdBy: r.createdBy,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createLicense(input: {
    expiresAt: string;
    maxActivations: number;
    createdBy: string;
    initialCodes: number;
  }): Promise<{ license: LicenseRow; codes: ActivationCodeRow[] }> {
    const licenseId = ulid();
    const keyHash = this.hash(licenseId);
    const now = new Date();

    const created = await this.prisma.$transaction(async (tx) => {
      const license = await tx.license.create({
        data: {
          id: licenseId,
          keyHash,
          status: 'ACTIVE',
          expiresAt: new Date(input.expiresAt),
          maxActivations: input.maxActivations,
          currentActivations: 0,
          createdBy: input.createdBy,
          createdAt: now,
          updatedAt: now,
        },
      });
      const codes: { row: ActivationCodeRow; plaintext: string }[] = [];
      for (let i = 0; i < input.initialCodes; i++) {
        const plaintext = generateActivationCode();
        const id = ulid();
        const row = await tx.activationCode.create({
          data: {
            id,
            codeHash: this.hash(plaintext),
            licenseId: license.id,
            createdAt: now,
            updatedAt: now,
          },
        });
        codes.push({
          plaintext,
          row: {
            id: row.id,
            licenseId: row.licenseId,
            redeemedAt: null,
            redeemedByAccountId: null,
            createdAt: row.createdAt.toISOString(),
            plaintext,
          },
        });
      }
      return { license, codes };
    });

    return {
      license: {
        id: created.license.id,
        status: created.license.status,
        expiresAt: created.license.expiresAt.toISOString(),
        maxActivations: created.license.maxActivations,
        currentActivations: created.license.currentActivations,
        createdBy: created.license.createdBy,
        createdAt: created.license.createdAt.toISOString(),
      },
      codes: created.codes.map((c) => c.row),
    };
  }

  async revokeLicense(id: string): Promise<void> {
    await this.prisma.license.update({
      where: { id },
      data: { status: 'REVOKED', updatedAt: new Date() },
    });
  }

  // ---- activation codes ----

  async listCodes(filter?: { redeemed?: 'ALL' | 'YES' | 'NO' }): Promise<ActivationCodeRow[]> {
    const where: Record<string, unknown> = {};
    if (filter?.redeemed === 'YES') where['redeemedAt'] = { not: null };
    if (filter?.redeemed === 'NO') where['redeemedAt'] = null;
    const rows = await this.prisma.activationCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map((r) => ({
      id: r.id,
      licenseId: r.licenseId,
      redeemedAt: r.redeemedAt?.toISOString() ?? null,
      redeemedByAccountId: r.redeemedByAccountId ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createCode(licenseId: string): Promise<ActivationCodeRow> {
    const plaintext = generateActivationCode();
    const now = new Date();
    const row = await this.prisma.activationCode.create({
      data: {
        id: ulid(),
        codeHash: this.hash(plaintext),
        licenseId,
        createdAt: now,
        updatedAt: now,
      },
    });
    return {
      id: row.id,
      licenseId: row.licenseId,
      redeemedAt: null,
      redeemedByAccountId: null,
      createdAt: row.createdAt.toISOString(),
      plaintext,
    };
  }

  // ---- accounts ----

  async listAccounts(): Promise<AccountRow[]> {
    const rows = await this.prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return rows.map((r) => ({
      id: r.id,
      externalAccountName: r.externalAccountName,
      discordUserId: r.discordUserId,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async resetAccount(accountId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.automationSession.deleteMany({ where: { accountId } });
      await tx.account.update({
        where: { id: accountId },
        data: { status: 'UNLINKED', discordUserId: null, updatedAt: new Date() },
      });
    });
  }

  // ---- sessions ----

  async listSessions(): Promise<SessionRow[]> {
    const rows = await this.prisma.automationSession.findMany({
      include: { account: true },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    return rows.map((r) => ({
      id: r.id,
      accountId: r.accountId,
      externalAccountName: r.account.externalAccountName,
      state: r.state,
      startedAt: r.startedAt?.toISOString() ?? null,
      stoppedAt: r.stoppedAt?.toISOString() ?? null,
    }));
  }

  // ---- env ----

  envSummary(): EnvSummary {
    const dbUrl = process.env['DATABASE_URL'] ?? '';
    let host = '';
    try {
      host = new URL(dbUrl).host;
    } catch {
      host = '<invalid>';
    }
    const admins = (process.env['ADMIN_DISCORD_USER_IDS'] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return {
      NODE_ENV: process.env['NODE_ENV'] ?? 'development',
      LOG_LEVEL: process.env['LOG_LEVEL'] ?? 'info',
      DATABASE_URL_host: host,
      DISCORD_APP_ID: process.env['DISCORD_APP_ID'] ?? '',
      DISCORD_DEV_GUILD_ID: process.env['DISCORD_DEV_GUILD_ID'] ?? null,
      ADMIN_DISCORD_USER_IDS_count: admins.length,
      LICENSE_HASH_PEPPER_present: (process.env['LICENSE_HASH_PEPPER'] ?? '').length >= 32,
    };
  }

  // ---- helpers ----

  private hash(plaintext: string): string {
    return createHmac('sha256', this.pepper).update(plaintext, 'utf8').digest('hex');
  }
}

function generateActivationCode(): string {
  // 4 groups of 5 alphanumeric chars: e.g. AB12C-DE3FG-HI4JK-LM5NO
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(20);
  const groups: string[] = [];
  for (let g = 0; g < 4; g++) {
    let s = '';
    for (let i = 0; i < 5; i++) {
      const byte = bytes[g * 5 + i] ?? 0;
      s += alphabet[byte % alphabet.length];
    }
    groups.push(s);
  }
  return groups.join('-');
}
