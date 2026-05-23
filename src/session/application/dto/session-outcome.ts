import type { LicenseId } from '../../../license/index.js';
import type { SessionState } from '../../domain/automation-session.js';
import type { SessionId } from '../../domain/session-id.js';

export interface SessionStateOutcome {
  readonly sessionId: SessionId;
  readonly accountId: string;
  readonly state: SessionState;
  readonly startedAt: Date | null;
  readonly stoppedAt: Date | null;
  /**
   * License context. Populated when a usable license was found. May be null
   * for /stop on an account whose license has since expired or been revoked.
   */
  readonly licenseId: LicenseId | null;
  readonly licenseExpiresAt: Date | null;
}
