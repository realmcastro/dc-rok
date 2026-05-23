import { InvalidSessionStateTransitionError } from './errors.js';
import type { SessionId } from './session-id.js';

export type SessionState = 'IDLE' | 'ACTIVE' | 'STOPPED';

export interface AutomationSessionSnapshot {
  readonly id: SessionId;
  /** Opaque account identifier owned by the account-link module. */
  readonly accountId: string;
  readonly state: SessionState;
  readonly startedAt: Date | null;
  readonly stoppedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Session intent aggregate.
 *
 * State transitions:
 *   IDLE    → ACTIVE   (start; sets startedAt, clears stoppedAt)
 *   STOPPED → ACTIVE   (resume; sets startedAt, clears stoppedAt)
 *   ACTIVE  → ACTIVE   (idempotent no-op)
 *   ACTIVE  → STOPPED  (sets stoppedAt)
 *   STOPPED → STOPPED  (idempotent no-op)
 *   IDLE    → STOPPED  (invalid; reject — nothing to stop)
 */
export class AutomationSession {
  private constructor(private readonly snapshot: AutomationSessionSnapshot) {}

  static fromSnapshot(snapshot: AutomationSessionSnapshot): AutomationSession {
    if (snapshot.state === 'ACTIVE' && snapshot.startedAt === null) {
      throw new InvalidSessionStateTransitionError('ACTIVE session must have startedAt');
    }
    return new AutomationSession(snapshot);
  }

  static createIdle(input: { id: SessionId; accountId: string; now: Date }): AutomationSession {
    return AutomationSession.fromSnapshot({
      id: input.id,
      accountId: input.accountId,
      state: 'IDLE',
      startedAt: null,
      stoppedAt: null,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  get id(): SessionId {
    return this.snapshot.id;
  }
  get accountId(): string {
    return this.snapshot.accountId;
  }
  get state(): SessionState {
    return this.snapshot.state;
  }
  get startedAt(): Date | null {
    return this.snapshot.startedAt === null ? null : new Date(this.snapshot.startedAt.getTime());
  }
  get stoppedAt(): Date | null {
    return this.snapshot.stoppedAt === null ? null : new Date(this.snapshot.stoppedAt.getTime());
  }

  toSnapshot(): AutomationSessionSnapshot {
    return {
      ...this.snapshot,
      startedAt: this.snapshot.startedAt === null ? null : new Date(this.snapshot.startedAt.getTime()),
      stoppedAt: this.snapshot.stoppedAt === null ? null : new Date(this.snapshot.stoppedAt.getTime()),
      createdAt: new Date(this.snapshot.createdAt.getTime()),
      updatedAt: new Date(this.snapshot.updatedAt.getTime()),
    };
  }

  start(now: Date): AutomationSession {
    if (this.snapshot.state === 'ACTIVE') {
      return this;
    }
    return new AutomationSession({
      ...this.snapshot,
      state: 'ACTIVE',
      startedAt: now,
      stoppedAt: null,
      updatedAt: now,
    });
  }

  stop(now: Date): AutomationSession {
    if (this.snapshot.state === 'STOPPED') {
      return this;
    }
    if (this.snapshot.state === 'IDLE') {
      throw new InvalidSessionStateTransitionError('cannot stop an IDLE session');
    }
    return new AutomationSession({
      ...this.snapshot,
      state: 'STOPPED',
      stoppedAt: now,
      updatedAt: now,
    });
  }

  /** Convenience for /status uptime: ms since startedAt while ACTIVE, else 0. */
  uptimeMs(now: Date): number {
    if (this.snapshot.state !== 'ACTIVE' || this.snapshot.startedAt === null) return 0;
    return Math.max(0, now.getTime() - this.snapshot.startedAt.getTime());
  }
}
