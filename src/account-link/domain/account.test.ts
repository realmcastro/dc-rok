import { describe, expect, it } from 'vitest';

import { asAccountId, parseDiscordUserId } from './account-id.js';
import { Account } from './account.js';
import {
  AccountAlreadyLinkedError,
  AccountSuspendedError,
  InvalidAccountStateTransitionError,
} from './errors.js';

const NOW = new Date('2026-05-23T12:00:00Z');
const ID = asAccountId('01ACCT0000000000000000000A');
const DISCORD = parseDiscordUserId('123456789012345678');

describe('Account', () => {
  it('createLinked yields an ACTIVE account', () => {
    const a = Account.createLinked({
      id: ID,
      externalAccountName: 'farm-01',
      discordUserId: DISCORD,
      now: NOW,
    });
    expect(a.status).toBe('ACTIVE');
    expect(a.discordUserId).toBe(DISCORD);
  });

  it('rejects empty externalAccountName', () => {
    expect(() =>
      Account.createLinked({ id: ID, externalAccountName: '   ', discordUserId: DISCORD, now: NOW }),
    ).toThrow(InvalidAccountStateTransitionError);
  });

  it('unlink flips ACTIVE → UNLINKED and clears discordUserId', () => {
    const a = Account.createLinked({
      id: ID,
      externalAccountName: 'farm-01',
      discordUserId: DISCORD,
      now: NOW,
    });
    const u = a.unlink(NOW);
    expect(u.status).toBe('UNLINKED');
    expect(u.discordUserId).toBeNull();
  });

  it('unlink is idempotent on UNLINKED account', () => {
    const u = Account.fromSnapshot({
      id: ID,
      externalAccountName: 'x',
      discordUserId: null,
      status: 'UNLINKED',
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(u.unlink(NOW)).toBe(u);
  });

  it('unlink throws on suspended account', () => {
    const s = Account.fromSnapshot({
      id: ID,
      externalAccountName: 'x',
      discordUserId: DISCORD,
      status: 'SUSPENDED',
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(() => s.unlink(NOW)).toThrow(AccountSuspendedError);
  });

  it('relinkTo only works from UNLINKED', () => {
    const u = Account.fromSnapshot({
      id: ID,
      externalAccountName: 'x',
      discordUserId: null,
      status: 'UNLINKED',
      createdAt: NOW,
      updatedAt: NOW,
    });
    const r = u.relinkTo(DISCORD, NOW);
    expect(r.status).toBe('ACTIVE');
    expect(r.discordUserId).toBe(DISCORD);
    expect(() => r.relinkTo(DISCORD, NOW)).toThrow(AccountAlreadyLinkedError);
  });

  it('fromSnapshot rejects ACTIVE without discord_user_id', () => {
    expect(() =>
      Account.fromSnapshot({
        id: ID,
        externalAccountName: 'x',
        discordUserId: null,
        status: 'ACTIVE',
        createdAt: NOW,
        updatedAt: NOW,
      }),
    ).toThrow(InvalidAccountStateTransitionError);
  });

  it('fromSnapshot rejects UNLINKED with a discord_user_id', () => {
    expect(() =>
      Account.fromSnapshot({
        id: ID,
        externalAccountName: 'x',
        discordUserId: DISCORD,
        status: 'UNLINKED',
        createdAt: NOW,
        updatedAt: NOW,
      }),
    ).toThrow(InvalidAccountStateTransitionError);
  });
});
