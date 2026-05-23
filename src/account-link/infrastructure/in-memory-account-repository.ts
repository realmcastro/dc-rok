import type { AccountId, DiscordUserId } from '../domain/account-id.js';
import type { Account } from '../domain/account.js';
import type { AccountRepository } from '../application/ports/account-repository.js';

export class InMemoryAccountRepository implements AccountRepository {
  private readonly byId = new Map<string, Account>();

  findById(id: AccountId): Promise<Account | null> {
    return Promise.resolve(this.byId.get(id) ?? null);
  }

  findByDiscordUserId(discordUserId: DiscordUserId): Promise<Account | null> {
    for (const a of this.byId.values()) {
      if (a.discordUserId === discordUserId) return Promise.resolve(a);
    }
    return Promise.resolve(null);
  }

  save(account: Account): Promise<void> {
    this.byId.set(account.id, account);
    return Promise.resolve();
  }

  count(): number {
    return this.byId.size;
  }
}
