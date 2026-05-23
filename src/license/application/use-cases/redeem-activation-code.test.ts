import { describe, expect, it, vi } from 'vitest';

import {
  FixedClock,
  InvalidInputError,
  SequenceIdGenerator,
  type Logger,
} from '../../../shared/index.js';
import { ActivationCode } from '../../domain/activation-code.js';
import {
  ActivationCodeAlreadyRedeemedError,
  ActivationCodeNotFoundError,
  LicenseExhaustedError,
  LicenseExpiredError,
  LicenseRevokedError,
} from '../../domain/errors.js';
import { asActivationCodeId, asLicenseId } from '../../domain/license-id.js';
import { License } from '../../domain/license.js';
import { HmacLicenseHasher } from '../../infrastructure/hmac-license-hasher.js';
import { InMemoryActivationCodeRepository } from '../../infrastructure/in-memory/in-memory-activation-code-repository.js';
import { InMemoryLicenseRepository } from '../../infrastructure/in-memory/in-memory-license-repository.js';
import { InMemoryLicenseUnitOfWork } from '../../infrastructure/in-memory/in-memory-unit-of-work.js';
import { RandomActivationCodeFactory } from '../../infrastructure/random-activation-code-factory.js';

import { IssueLicense } from './issue-license.js';
import { RedeemActivationCode } from './redeem-activation-code.js';
import { RevokeLicense } from './revoke-license.js';

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

function buildFixture(clockAt: Date = NOW) {
  const licenses = new InMemoryLicenseRepository();
  const codes = new InMemoryActivationCodeRepository();
  const hasher = new HmacLicenseHasher('a'.repeat(32));
  const clock = new FixedClock(clockAt);
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
  const redeem = new RedeemActivationCode({
    uow: new InMemoryLicenseUnitOfWork(licenses, codes),
    hasher,
    clock,
    log,
  });
  const revoke = new RevokeLicense({ licenses, clock, log });
  return { licenses, codes, hasher, clock, issue, redeem, revoke };
}

describe('RedeemActivationCode', () => {
  it('redeems a fresh code and bumps the license counter', async () => {
    const { issue, redeem } = buildFixture();
    const issued = await issue.run({
      issuerDiscordUserId: '111111111111111111',
      expiresAt: FUTURE,
      maxActivations: 2,
      codesToGenerate: 1,
    });
    const out = await redeem.run({
      code: issued.activationCodes[0]!.code,
      accountId: 'acct-1',
    });
    expect(out.licenseId).toBe(issued.licenseId);
    expect(out.remainingActivations).toBe(1);
  });

  it('rejects an unknown code', async () => {
    const { redeem } = buildFixture();
    await expect(
      redeem.run({ code: 'NOPE0-NOPE0-NOPE0-NOPE0', accountId: 'acct-1' }),
    ).rejects.toThrow(ActivationCodeNotFoundError);
  });

  it('rejects empty code or accountId', async () => {
    const { redeem } = buildFixture();
    await expect(redeem.run({ code: '   ', accountId: 'a' })).rejects.toThrow(InvalidInputError);
    await expect(redeem.run({ code: 'x', accountId: '' })).rejects.toThrow(InvalidInputError);
  });

  it('rejects a second redemption of the same code', async () => {
    const { issue, redeem } = buildFixture();
    const issued = await issue.run({
      issuerDiscordUserId: '111111111111111111',
      expiresAt: FUTURE,
      maxActivations: 2,
      codesToGenerate: 1,
    });
    const code = issued.activationCodes[0]!.code;
    await redeem.run({ code, accountId: 'acct-1' });
    await expect(redeem.run({ code, accountId: 'acct-2' })).rejects.toThrow(
      ActivationCodeAlreadyRedeemedError,
    );
  });

  it('refuses when license is exhausted', async () => {
    const { licenses, codes, hasher, redeem } = buildFixture();
    // Hand-build a license already at max activations and a fresh code attached.
    const licenseId = asLicenseId('01EXHAUST000000000000000AA');
    const codeId = asActivationCodeId('01EXHAUST000000000000000CC');
    const plaintext = 'EXHST-EXHST-EXHST-EXHST';
    await licenses.save(
      License.fromSnapshot({
        id: licenseId,
        keyHash: 'k',
        status: 'ACTIVE',
        expiresAt: FUTURE,
        maxActivations: 1,
        currentActivations: 1,
        createdBy: '111111111111111111',
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await codes.save(
      ActivationCode.fromSnapshot({
        id: codeId,
        codeHash: hasher.hash(plaintext),
        licenseId,
        redeemedAt: null,
        redeemedByAccountId: null,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    );
    await expect(redeem.run({ code: plaintext, accountId: 'acct-x' })).rejects.toThrow(
      LicenseExhaustedError,
    );
  });

  it('refuses when license is expired (by date)', async () => {
    const { issue, redeem, clock } = buildFixture();
    const issued = await issue.run({
      issuerDiscordUserId: '111111111111111111',
      expiresAt: new Date(NOW.getTime() + 60_000),
      maxActivations: 1,
      codesToGenerate: 1,
    });
    clock.set(new Date(NOW.getTime() + 120_000));
    await expect(
      redeem.run({ code: issued.activationCodes[0]!.code, accountId: 'a' }),
    ).rejects.toThrow(LicenseExpiredError);
  });

  it('refuses when license is revoked', async () => {
    const { issue, redeem, revoke } = buildFixture();
    const issued = await issue.run({
      issuerDiscordUserId: '111111111111111111',
      expiresAt: FUTURE,
      maxActivations: 1,
      codesToGenerate: 1,
    });
    await revoke.run({
      licenseId: issued.licenseId,
      revokedByDiscordUserId: '111111111111111111',
    });
    await expect(
      redeem.run({ code: issued.activationCodes[0]!.code, accountId: 'a' }),
    ).rejects.toThrow(LicenseRevokedError);
  });
});
