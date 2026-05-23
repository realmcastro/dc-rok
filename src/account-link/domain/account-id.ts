import { InvalidInputError } from '../../shared/index.js';

declare const accountIdBrand: unique symbol;
export type AccountId = string & { readonly [accountIdBrand]: true };

export function asAccountId(value: string): AccountId {
  return value as AccountId;
}

declare const discordUserIdBrand: unique symbol;
export type DiscordUserId = string & { readonly [discordUserIdBrand]: true };

const DISCORD_SNOWFLAKE = /^\d{17,20}$/;

export function parseDiscordUserId(value: string): DiscordUserId {
  if (!DISCORD_SNOWFLAKE.test(value)) {
    throw new InvalidInputError('invalid Discord user id', { metadata: { value } });
  }
  return value as DiscordUserId;
}
