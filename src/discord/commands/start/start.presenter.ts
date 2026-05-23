import type { EmbedBuilder } from 'discord.js';

import type { SessionStateOutcome } from '../../../session/index.js';
import type { CorrelationId } from '../../../shared/index.js';
import { buildEmbed } from '../../presenters/embed.js';

export function presentStartSuccess(
  outcome: SessionStateOutcome,
  correlationId: CorrelationId,
): EmbedBuilder {
  const expiresField = outcome.licenseExpiresAt
    ? {
        name: 'License expires',
        value: `<t:${String(Math.floor(outcome.licenseExpiresAt.getTime() / 1000))}:R>`,
        inline: true,
      }
    : undefined;
  const startedField = outcome.startedAt
    ? {
        name: 'Started',
        value: `<t:${String(Math.floor(outcome.startedAt.getTime() / 1000))}:R>`,
        inline: true,
      }
    : undefined;

  const fields = [expiresField, startedField].filter(
    (f): f is { name: string; value: string; inline: boolean } => f !== undefined,
  );

  return buildEmbed({
    kind: 'success',
    title: 'Session started',
    description: 'Your automation session is now ACTIVE.',
    correlationId,
    fields,
  });
}
