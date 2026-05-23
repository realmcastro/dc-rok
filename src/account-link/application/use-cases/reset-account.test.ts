import { describe, expect, it, vi } from 'vitest';

import { InMemoryAuditWriter } from '../../../audit/index.js';
import { AutomationSession, asSessionId } from '../../../session/index.js';
import { InMemorySessionRepository } from '../../../session/infrastructure/in-memory-session-repository.js';
import { NoopAgentRuntime } from '../../../session/infrastructure/noop-agent-runtime.js';
import {
  asCorrelationId,
  FixedClock,
  SequenceIdGenerator,
  type Logger,
} from '../../../shared/index.js';
import { asAccountId, parseDiscordUserId } from '../../domain/account-id.js';
import { Account } from '../../domain/account.js';
import { AccountNotFoundError, AccountSuspendedError } from '../../domain/errors.js';
import { InMemoryAccountRepository } from '../../infrastructure/in-memory-account-repository.js';
import { InMemoryResetUnitOfWork } from '../../infrastructure/in-memory-reset-unit-of-work.js';

import { ResetAccount } from './reset-account.js';

const NOW = new Date('2026-05-23T12:00:00Z');
const CORR = asCorrelationId('01CORR000000000000000000AA');
const ACCT_ID = asAccountId('01ACCT00000000000000000AA');
const DISCORD_UID = '222222222222222222';
const SES_ID = asSessionId('01SESS00000000000000000AA');

function noopLogger(): Logger {
  const fn = vi.fn();
  const self: Logger = {
    fatal: fn,
    error: fn,
    warn: fn,
    info: fn,
    debug: fn,
    trace: fn,
    child: () => self,
  };
  return self;
}

function build() {
  const accounts = new InMemoryAccountRepository();
  const sessions = new InMemorySessionRepository();
  const clock = new FixedClock(NOW);
  const audit = new InMemoryAuditWriter(new SequenceIdGenerator('AUD_'), clock);
  const log = noopLogger();
  const agentRuntime = new NoopAgentRuntime(log);
  const uow = new InMemoryResetUnitOfWork(accounts, sessions, audit);

  const reset = new ResetAccount({ uow, agentRuntime, clock, log });
  return { accounts, sessions, audit, reset, clock };
}

async function seedAccount(
  accounts: InMemoryAccountRepository,
  opts?: { status?: 'ACTIVE' | 'SUSPENDED' },
): Promise<Account> {
  const account = Account.fromSnapshot({
    id: ACCT_ID,
    externalAccountName: 'alice',
    discordUserId: parseDiscordUserId(DISCORD_UID),
    status: opts?.status ?? 'ACTIVE',
    createdAt: NOW,
    updatedAt: NOW,
  });
  await accounts.save(account);
  return account;
}

async function seedActiveSession(sessions: InMemorySessionRepository): Promise<void> {
  const session = AutomationSession.createIdle({
    id: SES_ID,
    accountId: ACCT_ID,
    now: NOW,
  }).start(NOW);
  await sessions.save(session);
}

describe('ResetAccount', () => {
  it('unlinks account and audits', async () => {
    const fx = build();
    await seedAccount(fx.accounts);

    const out = await fx.reset.run({ discordUserId: DISCORD_UID, correlationId: CORR });
    expect(out.accountId).toBe(ACCT_ID);
    expect(out.sessionWasStopped).toBe(false);

    const saved = await fx.accounts.findById(ACCT_ID);
    expect(saved?.status).toBe('UNLINKED');
    expect(saved?.discordUserId).toBeNull();

    const auditActions = fx.audit.entries.map((e) => e.action);
    expect(auditActions).toContain('account.unlink');
  });

  it('stops active session before unlinking', async () => {
    const fx = build();
    await seedAccount(fx.accounts);
    await seedActiveSession(fx.sessions);

    const out = await fx.reset.run({ discordUserId: DISCORD_UID, correlationId: CORR });
    expect(out.sessionWasStopped).toBe(true);

    const session = await fx.sessions.findByAccountId(ACCT_ID);
    expect(session?.state).toBe('STOPPED');

    const auditActions = fx.audit.entries.map((e) => e.action);
    expect(auditActions).toEqual(['session.stop', 'account.unlink']);
  });

  it('does not stop already-stopped session', async () => {
    const fx = build();
    await seedAccount(fx.accounts);
    const session = AutomationSession.createIdle({
      id: SES_ID,
      accountId: ACCT_ID,
      now: NOW,
    })
      .start(NOW)
      .stop(NOW);
    await fx.sessions.save(session);

    const out = await fx.reset.run({ discordUserId: DISCORD_UID, correlationId: CORR });
    expect(out.sessionWasStopped).toBe(false);

    const auditActions = fx.audit.entries.map((e) => e.action);
    expect(auditActions).not.toContain('session.stop');
  });

  it('rejects when no account linked', async () => {
    const fx = build();
    await expect(fx.reset.run({ discordUserId: DISCORD_UID, correlationId: CORR })).rejects.toThrow(
      AccountNotFoundError,
    );
  });

  it('rejects when account is suspended', async () => {
    const fx = build();
    await seedAccount(fx.accounts, { status: 'SUSPENDED' });
    await expect(fx.reset.run({ discordUserId: DISCORD_UID, correlationId: CORR })).rejects.toThrow(
      AccountSuspendedError,
    );
  });
});
