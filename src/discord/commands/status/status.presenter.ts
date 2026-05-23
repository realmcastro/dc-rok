import type { EmbedBuilder } from 'discord.js';

import type { SessionStateOutcome } from '../../../session/index.js';
import type { CorrelationId } from '../../../shared/index.js';
import { buildEmbed, type EmbedKind } from '../../presenters/embed.js';

interface StatusOutcome extends SessionStateOutcome {
  readonly uptimeMs: number;
}

function formatUptime(ms: number): string {
  if (ms <= 0) return '—';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${String(h)}h`);
  if (m > 0) parts.push(`${String(m)}m`);
  if (s > 0 || parts.length === 0) parts.push(`${String(s)}s`);
  return parts.join(' ');
}

function discordTimestamp(date: Date): string {
  return `<t:${String(Math.floor(date.getTime() / 1000))}:R>`;
}

const STATE_LABELS: Record<string, { kind: EmbedKind; label: string }> = {
  ACTIVE: { kind: 'success', label: 'ACTIVE' },
  STOPPED: { kind: 'warning', label: 'STOPPED' },
  IDLE: { kind: 'neutral', label: 'IDLE' },
};

export function presentStatus(outcome: StatusOutcome, correlationId: CorrelationId): EmbedBuilder {
  const { kind, label } = STATE_LABELS[outcome.state] ?? {
    kind: 'neutral' as const,
    label: outcome.state,
  };

  const fields: { name: string; value: string; inline: boolean }[] = [
    { name: 'State', value: label, inline: true },
  ];

  if (outcome.state === 'ACTIVE' && outcome.startedAt) {
    fields.push({
      name: 'Started',
      value: discordTimestamp(outcome.startedAt),
      inline: true,
    });
    fields.push({ name: 'Uptime', value: formatUptime(outcome.uptimeMs), inline: true });
  }

  if (outcome.state === 'STOPPED' && outcome.stoppedAt) {
    fields.push({
      name: 'Stopped',
      value: discordTimestamp(outcome.stoppedAt),
      inline: true,
    });
  }

  if (outcome.licenseExpiresAt) {
    fields.push({
      name: 'License expires',
      value: discordTimestamp(outcome.licenseExpiresAt),
      inline: true,
    });
  } else if (!outcome.licenseId) {
    fields.push({ name: 'License', value: 'None', inline: true });
  }

  return buildEmbed({
    kind,
    title: 'Session status',
    correlationId,
    fields,
  });
}
