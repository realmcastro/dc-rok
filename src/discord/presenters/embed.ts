import { EmbedBuilder } from 'discord.js';

import { shortCorrelation, type CorrelationId } from '../../shared/index.js';

export const COLORS = {
  success: 0x2ecc71,
  warning: 0xf1c40f,
  error: 0xe74c3c,
  info: 0x3498db,
  neutral: 0x95a5a6,
} as const;

export type EmbedKind = keyof typeof COLORS;

export interface EmbedOptions {
  readonly kind: EmbedKind;
  readonly title: string;
  readonly description?: string;
  readonly fields?: ReadonlyArray<{ name: string; value: string; inline?: boolean }>;
  readonly correlationId: CorrelationId;
}

/**
 * Shared embed builder. Every reply MUST flow through this so the correlation
 * id always appears in the footer.
 */
export function buildEmbed(opts: EmbedOptions): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS[opts.kind])
    .setTitle(opts.title)
    .setTimestamp(new Date())
    .setFooter({ text: `ref ${shortCorrelation(opts.correlationId)}` });

  if (opts.description) {
    embed.setDescription(opts.description);
  }
  if (opts.fields && opts.fields.length > 0) {
    embed.addFields(opts.fields.map((f) => ({ ...f })));
  }
  return embed;
}
