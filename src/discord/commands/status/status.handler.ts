import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';

import {
  AccountNotFoundError,
  type LookupAccountByDiscordUser,
} from '../../../account-link/index.js';
import type { GetSessionStatus } from '../../../session/index.js';
import { newCorrelationId } from '../../../shared/index.js';
import { buildErrorEmbed } from '../../presenters/error.js';
import { ephemeralReply } from '../../runtime/reply.js';
import type { SlashCommand, SlashHandler } from '../../runtime/slash-handler.js';

import { parseStatusInteraction } from './status.parser.js';
import { presentStatus } from './status.presenter.js';

export interface StatusCommandDeps {
  readonly lookupAccount: LookupAccountByDiscordUser;
  readonly getSessionStatus: GetSessionStatus;
}

export function makeStatusCommand(deps: StatusCommandDeps): SlashCommand {
  const builder = new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check your current automation session status')
    .setContexts(InteractionContextType.Guild);

  const handler: SlashHandler = async (interaction, ctx) => {
    const correlationId = newCorrelationId();
    const log = ctx.log.child({ op: 'discord.status', correlationId });

    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const input = parseStatusInteraction(interaction);
      const account = await deps.lookupAccount.run(input.discordUserId);
      if (!account) {
        throw new AccountNotFoundError('account not found; run /init first');
      }
      const outcome = await deps.getSessionStatus.run(account.id);
      await ephemeralReply(interaction, presentStatus(outcome, correlationId));
      log.info({ outcome: 'ok', state: outcome.state }, 'status queried');
    } catch (err) {
      log.warn({ outcome: 'error', err }, 'status failed');
      await ephemeralReply(interaction, buildErrorEmbed(err, correlationId));
    }
  };

  return { builder, handler };
}
