import type { ChatInputCommandInteraction } from 'discord.js';

export interface ResetInput {
  readonly discordUserId: string;
}

export function parseResetInteraction(interaction: ChatInputCommandInteraction): ResetInput {
  return { discordUserId: interaction.user.id };
}
