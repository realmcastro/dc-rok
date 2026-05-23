import { describe, expect, it } from 'vitest';

import { AutomationSession } from './automation-session.js';
import { InvalidSessionStateTransitionError } from './errors.js';
import { asSessionId } from './session-id.js';

const NOW = new Date('2026-05-23T12:00:00Z');
const LATER = new Date('2026-05-23T12:05:00Z');
const ID = asSessionId('01SESS00000000000000000AA');

describe('AutomationSession state machine', () => {
  it('createIdle yields an IDLE session with null timestamps', () => {
    const s = AutomationSession.createIdle({ id: ID, accountId: 'acct-1', now: NOW });
    expect(s.state).toBe('IDLE');
    expect(s.startedAt).toBeNull();
    expect(s.stoppedAt).toBeNull();
  });

  it('IDLE → ACTIVE on start, sets startedAt', () => {
    const a = AutomationSession.createIdle({ id: ID, accountId: 'acct-1', now: NOW }).start(LATER);
    expect(a.state).toBe('ACTIVE');
    expect(a.startedAt?.getTime()).toBe(LATER.getTime());
  });

  it('start is idempotent on ACTIVE (returns same instance)', () => {
    const a = AutomationSession.createIdle({ id: ID, accountId: 'acct-1', now: NOW }).start(LATER);
    expect(a.start(new Date(LATER.getTime() + 1000))).toBe(a);
  });

  it('ACTIVE → STOPPED on stop, sets stoppedAt', () => {
    const a = AutomationSession.createIdle({ id: ID, accountId: 'acct-1', now: NOW }).start(LATER);
    const s = a.stop(new Date(LATER.getTime() + 1000));
    expect(s.state).toBe('STOPPED');
    expect(s.stoppedAt).not.toBeNull();
  });

  it('STOPPED is idempotent on stop', () => {
    const stopped = AutomationSession.createIdle({ id: ID, accountId: 'acct-1', now: NOW })
      .start(LATER)
      .stop(LATER);
    expect(stopped.stop(LATER)).toBe(stopped);
  });

  it('STOPPED → ACTIVE allowed via start (resume)', () => {
    const stopped = AutomationSession.createIdle({ id: ID, accountId: 'acct-1', now: NOW })
      .start(LATER)
      .stop(LATER);
    const resumed = stopped.start(new Date(LATER.getTime() + 60_000));
    expect(resumed.state).toBe('ACTIVE');
    expect(resumed.stoppedAt).toBeNull();
  });

  it('IDLE → STOPPED is rejected', () => {
    const idle = AutomationSession.createIdle({ id: ID, accountId: 'acct-1', now: NOW });
    expect(() => idle.stop(LATER)).toThrow(InvalidSessionStateTransitionError);
  });

  it('uptimeMs is 0 unless ACTIVE', () => {
    const idle = AutomationSession.createIdle({ id: ID, accountId: 'acct-1', now: NOW });
    expect(idle.uptimeMs(LATER)).toBe(0);
    const stopped = idle.start(NOW).stop(LATER);
    expect(stopped.uptimeMs(LATER)).toBe(0);
  });

  it('uptimeMs reports ms since startedAt while ACTIVE', () => {
    const active = AutomationSession.createIdle({ id: ID, accountId: 'acct-1', now: NOW }).start(
      NOW,
    );
    expect(active.uptimeMs(new Date(NOW.getTime() + 5000))).toBe(5000);
  });

  it('fromSnapshot rejects ACTIVE without startedAt', () => {
    expect(() =>
      AutomationSession.fromSnapshot({
        id: ID,
        accountId: 'acct-1',
        state: 'ACTIVE',
        startedAt: null,
        stoppedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      }),
    ).toThrow(InvalidSessionStateTransitionError);
  });
});
