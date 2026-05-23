import {
  MessageFlags,
  type ChatInputCommandInteraction,
  type EmbedBuilder,
} from 'discord.js';

/**
 * Always-ephemeral reply helper. Replies that contain account-private data
 * MUST go through this; never call `interaction.reply` directly with private
 * data and non-ephemeral flags.
 */
export async function ephemeralReply(
  interaction: ChatInputCommandInteraction,
  embed: EmbedBuilder,
): Promise<void> {
  if (interaction.deferred) {
    await interaction.editReply({ embeds: [embed] });
    return;
  }
  if (interaction.replied) {
    await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
    return;
  }
  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
