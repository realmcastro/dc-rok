import type { ChatInputCommandInteraction } from 'discord.js';

export interface StopInput {
  readonly discordUserId: string;
}

export function parseStopInteraction(interaction: ChatInputCommandInteraction): StopInput {
  return { discordUserId: interaction.user.id };
}
