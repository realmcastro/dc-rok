import { describe, expect, it } from 'vitest';

import { asLicenseId } from '../../../license/domain/license-id.js';
import { asSessionId } from '../../../session/domain/session-id.js';
import { asCorrelationId } from '../../../shared/index.js';

import { presentStatus } from './status.presenter.js';

const CORR = asCorrelationId('01CORR000000000000000000AA');
const SID = asSessionId('01SESS00000000000000000AA');
const LID = asLicenseId('01LIC000000000000000000AA');
const NOW = new Date('2026-05-23T12:00:00Z');

describe('presentStatus', () => {
  it('shows ACTIVE state with uptime and started fields', () => {
    const embed = presentStatus(
      {
        sessionId: SID,
        accountId: 'acct-1',
        state: 'ACTIVE',
        startedAt: NOW,
        stoppedAt: null,
        licenseId: LID,
        licenseExpiresAt: new Date('2026-12-31T23:59:59Z'),
        uptimeMs: 3661_000,
      },
      CORR,
    );
    const json = embed.toJSON();
    expect(json.title).toBe('Session status');
    expect(json.color).toBe(0x2ecc71); // success = green

    const names = json.fields?.map((f) => f.name) ?? [];
    expect(names).toContain('State');
    expect(names).toContain('Started');
    expect(names).toContain('Uptime');
    expect(names).toContain('License expires');

    const uptime = json.fields?.find((f) => f.name === 'Uptime');
    expect(uptime?.value).toBe('1h 1m 1s');
  });

  it('shows STOPPED state with stopped field', () => {
    const embed = presentStatus(
      {
        sessionId: SID,
        accountId: 'acct-1',
        state: 'STOPPED',
        startedAt: NOW,
        stoppedAt: new Date('2026-05-23T12:05:00Z'),
        licenseId: LID,
        licenseExpiresAt: new Date('2026-12-31T23:59:59Z'),
        uptimeMs: 0,
      },
      CORR,
    );
    const json = embed.toJSON();
    expect(json.color).toBe(0xf1c40f); // warning = yellow

    const names = json.fields?.map((f) => f.name) ?? [];
    expect(names).toContain('Stopped');
    expect(names).not.toContain('Uptime');
  });

  it('shows IDLE state with no license', () => {
    const embed = presentStatus(
      {
        sessionId: SID,
        accountId: 'acct-1',
        state: 'IDLE',
        startedAt: null,
        stoppedAt: null,
        licenseId: null,
        licenseExpiresAt: null,
        uptimeMs: 0,
      },
      CORR,
    );
    const json = embed.toJSON();
    expect(json.color).toBe(0x95a5a6); // neutral = gray

    const license = json.fields?.find((f) => f.name === 'License');
    expect(license?.value).toBe('None');
  });

  it('formats zero uptime as dash', () => {
    const embed = presentStatus(
      {
        sessionId: SID,
        accountId: 'acct-1',
        state: 'ACTIVE',
        startedAt: NOW,
        stoppedAt: null,
        licenseId: LID,
        licenseExpiresAt: null,
        uptimeMs: 0,
      },
      CORR,
    );
    const json = embed.toJSON();
    const uptime = json.fields?.find((f) => f.name === 'Uptime');
    expect(uptime?.value).toBe('—');
  });
});
