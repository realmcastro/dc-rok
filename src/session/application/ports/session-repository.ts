import type { AutomationSession } from '../../domain/automation-session.js';
import type { SessionId } from '../../domain/session-id.js';

export interface SessionRepository {
  findById(id: SessionId): Promise<AutomationSession | null>;
  findByAccountId(accountId: string): Promise<AutomationSession | null>;
  save(session: AutomationSession): Promise<void>;
}
