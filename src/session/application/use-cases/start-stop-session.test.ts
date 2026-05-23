import { describe, expect, it, vi } from 'vitest';

import { InMemoryAuditWriter } from '../../../audit/index.js';
import {
  HmacLicenseHasher,
  InMemoryActivationCodeRepository,
  InMemoryLicenseRepository,
  InMemoryLicenseUnitOfWork,
  IssueLicense,
  LicenseValidationService,
  RandomActivationCodeFactory,
  RedeemActivationCode,
  RevokeLicense,
} from '../../../license/index.js';
import {
  asCorrelationId,
  FixedClock,
  SequenceIdGenerator,
  type Logger,
} from '../../../shared/index.js';
import { SessionNotFoundError } from '../../domain/errors.js';
import { InMemorySessionRepository } from '../../infrastructure/in-memory-session-repository.js';
import { InMemorySessionUnitOfWork } from '../../infrastructure/in-memory-session-unit-of-work.js';
import { NoopAgentRuntime } from '../../infrastructure/noop-agent-runtime.js';
import {
  NoLicenseForAccountError,
  SessionLicenseExpiredError,
  SessionLicenseRevokedError,
} from '../errors.js';
import { StartSession } from './start-session.js';
import { StopSession } from './stop-session.js';

const NOW = new Date('2026-05-23T12:00:00Z');
const FUTURE = new Date('2026-12-31T23:59:59Z');
const CORR = asCorrelationId('01CORR000000000000000000AA');

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
  const licenses = new InMemoryLicenseRepository();
  const codes = new InMemoryActivationCodeRepository();
  const sessions = new InMemorySessionRepository();
  const clock = new FixedClock(NOW);
  const log = noopLogger();
  const hasher = new HmacLicenseHasher('a'.repeat(32));
  const audit = new InMemoryAuditWriter(new SequenceIdGenerator('AUD_'), clock);

  const issue = new IssueLicense({
    licenses,
    codes,
    hasher,
    codeFactory: new RandomActivationCodeFactory(),
    ids: new SequenceIdGenerator('LIC_'),
    clock,
    log,
  });
  const redeem = new RedeemActivationCode({
    uow: new InMemoryLicenseUnitOfWork(licenses, codes),
    hasher,
    clock,
    log,
  });
  const revoke = new RevokeLicense({ licenses, clock, log });

  const validator = new LicenseValidationService(licenses, codes);
  const agentRuntime = new NoopAgentRuntime(log);
  const uow = new InMemorySessionUnitOfWork(sessions, licenses, codes, audit);

  const start = new StartSession({
    uow,
    licenseValidator: validator,
    agentRuntime,
    ids: new SequenceIdGenerator('SES_'),
    clock,
    log,
  });
  const stop = new StopSession({
    uow,
    licenseValidator: validator,
    agentRuntime,
    clock,
    log,
  });

  return { sessions, audit, issue, redeem, revoke, start, stop, clock };
}

async function setupLicensedAccount(
  fixture: ReturnType<typeof build>,
  accountId: string,
  opts?: { expiresAt?: Date; maxActivations?: number },
): Promise<{ licenseId: string }> {
  const issued = await fixture.issue.run({
    issuerDiscordUserId: '111111111111111111',
    expiresAt: opts?.expiresAt ?? FUTURE,
    maxActivations: opts?.maxActivations ?? 2,
    codesToGenerate: 1,
  });
  await fixture.redeem.run({ code: issued.activationCodes[0]!.code, accountId });
  return { licenseId: issued.licenseId };
}

describe('StartSession', () => {
  it('starts a new session, audits the transition', async () => {
    const fx = build();
    const { licenseId } = await setupLicensedAccount(fx, 'acct-1');
    const out = await fx.start.run({
      accountId: 'acct-1',
      actorDiscordUserId: '222222222222222222',
      correlationId: CORR,
    });
    expect(out.state).toBe('ACTIVE');
    expect(out.licenseId).toBe(licenseId);
    expect(out.startedAt).not.toBeNull();
    expect(fx.sessions.count()).toBe(1);
    expect(fx.audit.entries.at(-1)?.action).toBe('session.start');
  });

  it('start is idempotent (ACTIVE → ACTIVE returns ACTIVE state)', async () => {
    const fx = build();
    await setupLicensedAccount(fx, 'acct-1');
    await fx.start.run({
      accountId: 'acct-1',
      actorDiscordUserId: '222222222222222222',
      correlationId: CORR,
    });
    const out2 = await fx.start.run({
      accountId: 'acct-1',
      actorDiscordUserId: '222222222222222222',
      correlationId: CORR,
    });
    expect(out2.state).toBe('ACTIVE');
  });

  it('rejects when no license exists for account', async () => {
    const fx = build();
    await expect(
      fx.start.run({
        accountId: 'acct-unknown',
        actorDiscordUserId: '222222222222222222',
        correlationId: CORR,
      }),
    ).rejects.toThrow(NoLicenseForAccountError);
  });

  it('rejects when license is revoked', async () => {
    const fx = build();
    const { licenseId } = await setupLicensedAccount(fx, 'acct-1');
    await fx.revoke.run({
      licenseId: licenseId as unknown as Parameters<typeof fx.revoke.run>[0]['licenseId'],
      revokedByDiscordUserId: '111111111111111111',
    });
    await expect(
      fx.start.run({
        accountId: 'acct-1',
        actorDiscordUserId: '222222222222222222',
        correlationId: CORR,
      }),
    ).rejects.toThrow(SessionLicenseRevokedError);
  });

  it('rejects when license is expired', async () => {
    const fx = build();
    await setupLicensedAccount(fx, 'acct-1', {
      expiresAt: new Date(NOW.getTime() + 60_000),
    });
    fx.clock.set(new Date(NOW.getTime() + 120_000));
    await expect(
      fx.start.run({
        accountId: 'acct-1',
        actorDiscordUserId: '222222222222222222',
        correlationId: CORR,
      }),
    ).rejects.toThrow(SessionLicenseExpiredError);
  });
});

describe('StopSession', () => {
  it('stops an active session and audits the transition', async () => {
    const fx = build();
    await setupLicensedAccount(fx, 'acct-1');
    await fx.start.run({
      accountId: 'acct-1',
      actorDiscordUserId: '222222222222222222',
      correlationId: CORR,
    });
    const out = await fx.stop.run({
      accountId: 'acct-1',
      actorDiscordUserId: '222222222222222222',
      correlationId: CORR,
    });
    expect(out.state).toBe('STOPPED');
    expect(out.stoppedAt).not.toBeNull();
    expect(fx.audit.entries.at(-1)?.action).toBe('session.stop');
  });

  it('rejects when no session exists', async () => {
    const fx = build();
    await setupLicensedAccount(fx, 'acct-1');
    await expect(
      fx.stop.run({
        accountId: 'acct-1',
        actorDiscordUserId: '222222222222222222',
        correlationId: CORR,
      }),
    ).rejects.toThrow(SessionNotFoundError);
  });

  it('returns null licenseId when license was revoked after session started', async () => {
    const fx = build();
    const { licenseId } = await setupLicensedAccount(fx, 'acct-1');
    await fx.start.run({
      accountId: 'acct-1',
      actorDiscordUserId: '222222222222222222',
      correlationId: CORR,
    });
    await fx.revoke.run({
      licenseId: licenseId as unknown as Parameters<typeof fx.revoke.run>[0]['licenseId'],
      revokedByDiscordUserId: '111111111111111111',
    });
    const out = await fx.stop.run({
      accountId: 'acct-1',
      actorDiscordUserId: '222222222222222222',
      correlationId: CORR,
    });
    expect(out.state).toBe('STOPPED');
    expect(out.licenseId).toBeNull();
  });
});
