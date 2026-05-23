import type { EmbedBuilder } from 'discord.js';

import type { LinkOutcome } from '../../../account-link/index.js';
import type { CorrelationId } from '../../../shared/index.js';
import { buildEmbed } from '../../presenters/embed.js';

export function presentInitSuccess(
  outcome: LinkOutcome,
  correlationId: CorrelationId,
): EmbedBuilder {
  return buildEmbed({
    kind: 'success',
    title: 'Account linked',
    description: `You are now linked to **${outcome.externalAccountName}**.`,
    correlationId,
    fields: [
      {
        name: 'License expires',
        value: `<t:${String(Math.floor(outcome.licenseExpiresAt.getTime() / 1000))}:R>`,
        inline: true,
      },
      {
        name: 'Remaining activations',
        value: String(outcome.remainingActivations),
        inline: true,
      },
    ],
  });
}
