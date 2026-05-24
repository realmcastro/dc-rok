import { describe, expect, it, vi } from 'vitest';

import { InMemoryAuditWriter } from '../../../audit/index.js';
import {
  HmacLicenseHasher,
  InMemoryActivationCodeRepository,
  InMemoryLicenseRepository,
  IssueLicense,
  RandomActivationCodeFactory,
  RedeemInContext,
} from '../../../license/index.js';
import {
  ActivationCodeAlreadyRedeemedError,
  ActivationCodeNotFoundError,
} from '../../../license/index.js';
import {
  asCorrelationId,
  FixedClock,
  SequenceIdGenerator,
  type Logger,
} from '../../../shared/index.js';
import { DiscordUserAlreadyLinkedError } from '../../domain/errors.js';
import { InMemoryAccountRepository } from '../../infrastructure/in-memory-account-repository.js';
import { InMemoryLinkUnitOfWork } from '../../infrastructure/in-memory-link-unit-of-work.js';

import { LinkAccount } from './link-account.js';

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
  const accounts = new InMemoryAccountRepository();
  const clock = new FixedClock(NOW);
  const ids = new SequenceIdGenerator('ACC_');
  const audit = new InMemoryAuditWriter(new SequenceIdGenerator('AUD_'), clock);
  const hasher = new HmacLicenseHasher('a'.repeat(32));
  const log = noopLogger();

  const issue = new IssueLicense({
    licenses,
    codes,
    hasher,
    codeFactory: new RandomActivationCodeFactory(),
    ids: new SequenceIdGenerator('LIC_'),
    clock,
    log,
  });

  const redeemInContext = new RedeemInContext({ hasher, clock });
  const uow = new InMemoryLinkUnitOfWork(accounts, licenses, codes, audit);
  const linkAccount = new LinkAccount({ uow, redeemInContext, ids, clock, log });

  return { accounts, licenses, codes, audit, issue, linkAccount };
}

describe('LinkAccount', () => {
  it('creates an ACTIVE account, marks the code redeemed, and writes audit', async () => {
    const { accounts, audit, issue, linkAccount } = build();
    const issued = await issue.run({
      issuerDiscordUserId: '111111111111111111',
      expiresAt: FUTURE,
      maxActivations: 2,
      codesToGenerate: 1,
    });

    const outcome = await linkAccount.run({
      code: issued.activationCodes[0]!.code,
      discordUserId: '222222222222222222',
      externalAccountName: 'farm-01',
      correlationId: CORR,
    });

    expect(outcome.licenseId).toBe(issued.licenseId);
    expect(outcome.remainingActivations).toBe(1);
    expect(outcome.externalAccountName).toBe('farm-01');
    expect(accounts.count()).toBe(1);
    expect(audit.entries).toHaveLength(1);
    expect(audit.entries[0]!.action).toBe('account.link');
    expect(audit.entries[0]!.payload['licenseId']).toBe(issued.licenseId);
    // CRITICAL: plaintext code never appears in audit payload.
    expect(JSON.stringify(audit.entries[0]!.payload)).not.toContain(
      issued.activationCodes[0]!.code,
    );
  });

  it('persists the account BEFORE saving the redeemed activation code (FK ordering)', async () => {
    // Regression: PrismaActivationCodeRepository.save() sets
    // redeemed_by_account_id, which has a FK to accounts(id). If the code is
    // saved before the account row exists, Postgres throws P2003. The pure
    // in-memory repos don't enforce FKs, so we assert call order directly.
    const { accounts, codes, issue, linkAccount } = build();
    const issued = await issue.run({
      issuerDiscordUserId: '111111111111111111',
      expiresAt: FUTURE,
      maxActivations: 2,
      codesToGenerate: 1,
    });

    const order: string[] = [];
    const accountSave = vi.spyOn(accounts, 'save').mockImplementation(async (a) => {
      order.push('account.save');
      await InMemoryAccountRepository.prototype.save.call(accounts, a);
    });
    const codeSave = vi.spyOn(codes, 'save').mockImplementation(async (c) => {
      order.push('code.save');
      await InMemoryActivationCodeRepository.prototype.save.call(codes, c);
    });

    await linkAccount.run({
      code: issued.activationCodes[0]!.code,
      discordUserId: '777777777777777777',
      externalAccountName: 'farm-01',
      correlationId: CORR,
    });

    expect(accountSave).toHaveBeenCalled();
    expect(codeSave).toHaveBeenCalled();
    expect(order.indexOf('account.save')).toBeLessThan(order.indexOf('code.save'));
  });

  it('rejects when the Discord user is already linked', async () => {
    const { issue, linkAccount } = build();
    const issued = await issue.run({
      issuerDiscordUserId: '111111111111111111',
      expiresAt: FUTURE,
      maxActivations: 2,
      codesToGenerate: 2,
    });
    await linkAccount.run({
      code: issued.activationCodes[0]!.code,
      discordUserId: '333333333333333333',
      externalAccountName: 'farm-01',
      correlationId: CORR,
    });
    await expect(
      linkAccount.run({
        code: issued.activationCodes[1]!.code,
        discordUserId: '333333333333333333',
        externalAccountName: 'farm-02',
        correlationId: CORR,
      }),
    ).rejects.toThrow(DiscordUserAlreadyLinkedError);
  });

  it('rejects an unknown code', async () => {
    const { linkAccount } = build();
    await expect(
      linkAccount.run({
        code: 'NOPE0-NOPE0-NOPE0-NOPE0',
        discordUserId: '444444444444444444',
        externalAccountName: 'farm-01',
        correlationId: CORR,
      }),
    ).rejects.toThrow(ActivationCodeNotFoundError);
  });

  it('rejects a code that was already redeemed', async () => {
    const { issue, linkAccount } = build();
    const issued = await issue.run({
      issuerDiscordUserId: '111111111111111111',
      expiresAt: FUTURE,
      maxActivations: 2,
      codesToGenerate: 1,
    });
    const code = issued.activationCodes[0]!.code;
    await linkAccount.run({
      code,
      discordUserId: '555555555555555555',
      externalAccountName: 'farm-01',
      correlationId: CORR,
    });
    await expect(
      linkAccount.run({
        code,
        discordUserId: '666666666666666666',
        externalAccountName: 'farm-02',
        correlationId: CORR,
      }),
    ).rejects.toThrow(ActivationCodeAlreadyRedeemedError);
  });
});
