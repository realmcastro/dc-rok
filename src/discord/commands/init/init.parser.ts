import type { ChatInputCommandInteraction } from 'discord.js';
import { z } from 'zod';

import { InvalidInputError } from '../../../shared/index.js';

const InputSchema = z.object({
  code: z.string().trim().min(1, 'code is required').max(64, 'code is too long'),
});

export interface InitInput {
  readonly code: string;
  readonly discordUserId: string;
  readonly externalAccountName: string;
}

export function parseInitInteraction(interaction: ChatInputCommandInteraction): InitInput {
  const result = InputSchema.safeParse({
    code: interaction.options.getString('code', true),
  });
  if (!result.success) {
    throw new InvalidInputError(result.error.issues[0]?.message ?? 'invalid input');
  }

  // External account name defaults to the Discord user's display name (or
  // username). Phase 2 will support an admin command to rename.
  const externalAccountName =
    interaction.member?.user.username ?? interaction.user.username ?? interaction.user.id;

  return {
    code: result.data.code,
    discordUserId: interaction.user.id,
    externalAccountName,
  };
}
