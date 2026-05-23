import type { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

import type { Logger } from '../../shared/index.js';

/**
 * Context passed to every slash handler. Discrete from `Deps` of any specific
 * command — handlers should pull what they need from a wider container.
 */
export interface SlashHandlerCtx {
  readonly log: Logger;
}

export type SlashHandler = (
  interaction: ChatInputCommandInteraction,
  ctx: SlashHandlerCtx,
) => Promise<void>;

export interface SlashCommand {
  readonly builder: SlashCommandBuilder | Pick<SlashCommandBuilder, 'name' | 'toJSON'>;
  readonly handler: SlashHandler;
}
