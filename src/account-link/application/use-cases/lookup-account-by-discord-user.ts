import { parseDiscordUserId } from '../../domain/account-id.js';
import type { Account } from '../../domain/account.js';
import type { AccountRepository } from '../ports/account-repository.js';

export class LookupAccountByDiscordUser {
  constructor(private readonly accounts: AccountRepository) {}

  async run(discordUserId: string): Promise<Account | null> {
    const id = parseDiscordUserId(discordUserId);
    return await this.accounts.findByDiscordUserId(id);
  }
}
