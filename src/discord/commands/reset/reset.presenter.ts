import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type EmbedBuilder } from 'discord.js';

import type { ResetOutcome } from '../../../account-link/index.js';
import type { CorrelationId } from '../../../shared/index.js';
import { buildEmbed } from '../../presenters/embed.js';

export function presentResetConfirmation(correlationId: CorrelationId): {
  embed: EmbedBuilder;
  row: ActionRowBuilder<ButtonBuilder>;
} {
  const embed = buildEmbed({
    kind: 'warning',
    title: 'Confirm reset',
    description:
      'This will unlink your Discord account and stop any active session. ' +
      'You will need a new activation code to link again.\n\n' +
      'Are you sure?',
    correlationId,
  });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('reset:confirm')
      .setLabel('Yes, reset')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('reset:cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary),
  );

  return { embed, row };
}

export function presentResetSuccess(
  outcome: ResetOutcome,
  correlationId: CorrelationId,
): EmbedBuilder {
  const parts = ['Your account has been unlinked.'];
  if (outcome.sessionWasStopped) {
    parts.push('Active session was stopped.');
  }

  return buildEmbed({
    kind: 'success',
    title: 'Account reset',
    description: parts.join(' '),
    correlationId,
  });
}

export function presentResetCancelled(correlationId: CorrelationId): EmbedBuilder {
  return buildEmbed({
    kind: 'neutral',
    title: 'Reset cancelled',
    description: 'No changes were made.',
    correlationId,
  });
}

export function presentResetTimedOut(correlationId: CorrelationId): EmbedBuilder {
  return buildEmbed({
    kind: 'neutral',
    title: 'Reset timed out',
    description: 'No confirmation received. No changes were made.',
    correlationId,
  });
}
