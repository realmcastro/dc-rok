import type { ChatInputCommandInteraction } from 'discord.js';

export interface StatusInput {
  readonly discordUserId: string;
}

export function parseStatusInteraction(interaction: ChatInputCommandInteraction): StatusInput {
  return { discordUserId: interaction.user.id };
}
