import type { ChatInputCommandInteraction } from 'discord.js';

export interface StartInput {
  readonly discordUserId: string;
}

export function parseStartInteraction(interaction: ChatInputCommandInteraction): StartInput {
  return { discordUserId: interaction.user.id };
}
