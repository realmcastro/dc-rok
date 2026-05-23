import type { EmbedBuilder } from 'discord.js';

import type { SessionStateOutcome } from '../../../session/index.js';
import type { CorrelationId } from '../../../shared/index.js';
import { buildEmbed } from '../../presenters/embed.js';

export function presentStopSuccess(
  outcome: SessionStateOutcome,
  correlationId: CorrelationId,
): EmbedBuilder {
  const stoppedField = outcome.stoppedAt
    ? {
        name: 'Stopped',
        value: `<t:${Math.floor(outcome.stoppedAt.getTime() / 1000)}:R>`,
        inline: true,
      }
    : undefined;

  const fields = stoppedField ? [stoppedField] : [];

  return buildEmbed({
    kind: 'success',
    title: 'Session stopped',
    description: 'Your automation session is now STOPPED.',
    correlationId,
    fields,
  });
}
