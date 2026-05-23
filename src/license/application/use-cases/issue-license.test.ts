import { describe, expect, it, vi } from 'vitest';

import {
  FixedClock,
  InvalidInputError,
  SequenceIdGenerator,
  type Logger,
} from '../../../shared/index.js';
import { HmacLicenseHasher } from '../../infrastructure/hmac-license-hasher.js';
import { InMemoryActivationCodeRepository } from '../../infrastructure/in-memory/in-memory-activation-code-repository.js';
import { InMemoryLicenseRepository } from '../../infrastructure/in-memory/in-memory-license-repository.js';
import { RandomActivationCodeFactory } from '../../infrastructure/random-activation-code-factory.js';

import { IssueLicense } from './issue-license.js';

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

function buildDeps() {
  const licenses = new InMemoryLicenseRepository();
  const codes = new InMemoryActivationCodeRepository();
  return {
    licenses,
    codes,
    useCase: new IssueLicense({
      licenses,
      codes,
      hasher: new HmacLicenseHasher('a'.repeat(32)),
      codeFactory: new RandomActivationCodeFactory(),
      ids: new SequenceIdGenerator(),
      clock: new FixedClock(NOW),
      log: noopLogger(),
    }),
  };
}

describe('IssueLicense', () => {
  it('persists a license and the requested number of activation codes', async () => {
    const { licenses, codes, useCase } = buildDeps();
    const out = await useCase.run({
      issuerDiscordUserId: '111111111111111111',
      expiresAt: FUTURE,
      maxActivations: 5,
      codesToGenerate: 3,
    });
    expect(licenses.count()).toBe(1);
    expect(codes.count()).toBe(3);
    expect(out.activationCodes).toHaveLength(3);
    expect(new Set(out.activationCodes.map((c) => c.code)).size).toBe(3);
  });

  it('rejects maxActivations < 1', async () => {
    const { useCase } = buildDeps();
    await expect(
      useCase.run({
        issuerDiscordUserId: '111111111111111111',
        expiresAt: FUTURE,
        maxActivations: 0,
        codesToGenerate: 1,
      }),
    ).rejects.toThrow(InvalidInputError);
  });

  it('rejects codesToGenerate > maxActivations', async () => {
    const { useCase } = buildDeps();
    await expect(
      useCase.run({
        issuerDiscordUserId: '111111111111111111',
        expiresAt: FUTURE,
        maxActivations: 2,
        codesToGenerate: 5,
      }),
    ).rejects.toThrow(InvalidInputError);
  });

  it('rejects expiresAt in the past', async () => {
    const { useCase } = buildDeps();
    await expect(
      useCase.run({
        issuerDiscordUserId: '111111111111111111',
        expiresAt: new Date('2020-01-01T00:00:00Z'),
        maxActivations: 1,
        codesToGenerate: 1,
      }),
    ).rejects.toThrow(InvalidInputError);
  });
});
