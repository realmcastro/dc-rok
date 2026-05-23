import type { AccountId, DiscordUserId } from '../../domain/account-id.js';
import type { Account } from '../../domain/account.js';

export interface AccountRepository {
  findById(id: AccountId): Promise<Account | null>;
  findByDiscordUserId(discordUserId: DiscordUserId): Promise<Account | null>;
  save(account: Account): Promise<void>;
}
