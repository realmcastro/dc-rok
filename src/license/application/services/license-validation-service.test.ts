import { describe, expect, it, vi } from 'vitest';

import { FixedClock, SequenceIdGenerator, type Logger } from '../../../shared/index.js';
import { HmacLicenseHasher } from '../../infrastructure/hmac-license-hasher.js';
import { InMemoryActivationCodeRepository } from '../../infrastructure/in-memory/in-memory-activation-code-repository.js';
import { InMemoryLicenseRepository } from '../../infrastructure/in-memory/in-memory-license-repository.js';
import { InMemoryLicenseUnitOfWork } from '../../infrastructure/in-memory/in-memory-unit-of-work.js';
import { RandomActivationCodeFactory } from '../../infrastructure/random-activation-code-factory.js';
import { IssueLicense } from '../use-cases/issue-license.js';
import { RedeemActivationCode } from '../use-cases/redeem-activation-code.js';
import { RevokeLicense } from '../use-cases/revoke-license.js';

import { LicenseValidationService } from './license-validation-service.js';

const NOW = new Date('2026-05-23T12:00:00Z');
const FUTURE = new Date('2026-12-31T23:59:59Z');

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
  const clock = new FixedClock(NOW);
  const hasher = new HmacLicenseHasher('a'.repeat(32));
  const log = noopLogger();
  const ids = new SequenceIdGenerator('LIC_');
  const issue = new IssueLicense({
    licenses,
    codes,
    hasher,
    codeFactory: new RandomActivationCodeFactory(),
    ids,
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
  return { issue, redeem, revoke, validator, clock };
}

describe('LicenseValidationService', () => {
  it('returns NO_LICENSE_FOR_ACCOUNT when account has no codes', async () => {
    const { validator } = build();
    const result = await validator.validateForAccount('acct-unknown', NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('NO_LICENSE_FOR_ACCOUNT');
  });

  it('returns ok with licenseId when account has an active redeemed code', async () => {
    const { issue, redeem, validator } = build();
    const issued = await issue.run({
      issuerDiscordUserId: '111111111111111111',
      expiresAt: FUTURE,
      maxActivations: 2,
      codesToGenerate: 1,
    });
    await redeem.run({ code: issued.activationCodes[0]!.code, accountId: 'acct-1' });
    const result = await validator.validateForAccount('acct-1', NOW);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.licenseId).toBe(issued.licenseId);
  });

  it('returns LICENSE_REVOKED when license was revoked', async () => {
    const { issue, redeem, revoke, validator } = build();
    const issued = await issue.run({
      issuerDiscordUserId: '111111111111111111',
      expiresAt: FUTURE,
      maxActivations: 2,
      codesToGenerate: 1,
    });
    await redeem.run({ code: issued.activationCodes[0]!.code, accountId: 'acct-1' });
    await revoke.run({
      licenseId: issued.licenseId,
      revokedByDiscordUserId: '111111111111111111',
    });
    const result = await validator.validateForAccount('acct-1', NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('LICENSE_REVOKED');
  });

  it('returns LICENSE_EXPIRED when now is past expiry', async () => {
    const { issue, redeem, validator, clock } = build();
    const issued = await issue.run({
      issuerDiscordUserId: '111111111111111111',
      expiresAt: new Date(NOW.getTime() + 60_000),
      maxActivations: 1,
      codesToGenerate: 1,
    });
    await redeem.run({ code: issued.activationCodes[0]!.code, accountId: 'acct-1' });
    clock.set(new Date(NOW.getTime() + 120_000));
    const result = await validator.validateForAccount('acct-1', clock.now());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('LICENSE_EXPIRED');
  });
});
