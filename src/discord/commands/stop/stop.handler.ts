import { InteractionContextType, SlashCommandBuilder } from 'discord.js';

import {
  AccountNotFoundError,
  type LookupAccountByDiscordUser,
} from '../../../account-link/index.js';
import type { StopSession } from '../../../session/index.js';
import { newCorrelationId } from '../../../shared/index.js';
import { buildErrorEmbed } from '../../presenters/error.js';
import { ephemeralReply } from '../../runtime/reply.js';
import type { SlashCommand, SlashHandler } from '../../runtime/slash-handler.js';

import { parseStopInteraction } from './stop.parser.js';
import { presentStopSuccess } from './stop.presenter.js';

export interface StopCommandDeps {
  readonly lookupAccount: LookupAccountByDiscordUser;
  readonly stopSession: StopSession;
}

export function makeStopCommand(deps: StopCommandDeps): SlashCommand {
  const builder = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop your automation session')
    .setContexts(InteractionContextType.Guild);

  const handler: SlashHandler = async (interaction, ctx) => {
    const correlationId = newCorrelationId();
    const log = ctx.log.child({ op: 'discord.stop', correlationId });

    try {
      const input = parseStopInteraction(interaction);
      const account = await deps.lookupAccount.run(input.discordUserId);
      if (!account) {
        throw new AccountNotFoundError('account not found; run /init first');
      }
      const outcome = await deps.stopSession.run({
        accountId: account.id,
        actorDiscordUserId: input.discordUserId,
        correlationId,
      });
      await ephemeralReply(interaction, presentStopSuccess(outcome, correlationId));
      log.info({ outcome: 'ok', sessionId: outcome.sessionId }, 'stop succeeded');
    } catch (err) {
      log.warn({ outcome: 'error', err }, 'stop failed');
      await ephemeralReply(interaction, buildErrorEmbed(err, correlationId));
    }
  };

  return { builder, handler };
}
