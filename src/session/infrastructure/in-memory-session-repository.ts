import type { AutomationSession } from '../domain/automation-session.js';
import type { SessionId } from '../domain/session-id.js';
import type { SessionRepository } from '../application/ports/session-repository.js';

export class InMemorySessionRepository implements SessionRepository {
  private readonly byId = new Map<string, AutomationSession>();

  findById(id: SessionId): Promise<AutomationSession | null> {
    return Promise.resolve(this.byId.get(id) ?? null);
  }

  findByAccountId(accountId: string): Promise<AutomationSession | null> {
    for (const s of this.byId.values()) {
      if (s.accountId === accountId) return Promise.resolve(s);
    }
    return Promise.resolve(null);
  }

  save(session: AutomationSession): Promise<void> {
    this.byId.set(session.id, session);
    return Promise.resolve();
  }

  count(): number {
    return this.byId.size;
  }
}
