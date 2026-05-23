import { SlashCommandBuilder } from 'discord.js';

import {
  AccountNotFoundError,
  type LookupAccountByDiscordUser,
} from '../../../account-link/index.js';
import type { StartSession } from '../../../session/index.js';
import { newCorrelationId } from '../../../shared/index.js';
import { buildErrorEmbed } from '../../presenters/error.js';
import { ephemeralReply } from '../../runtime/reply.js';
import type { SlashCommand, SlashHandler } from '../../runtime/slash-handler.js';
import { parseStartInteraction } from './start.parser.js';
import { presentStartSuccess } from './start.presenter.js';

export interface StartCommandDeps {
  readonly lookupAccount: LookupAccountByDiscordUser;
  readonly startSession: StartSession;
}

export function makeStartCommand(deps: StartCommandDeps): SlashCommand {
  const builder = new SlashCommandBuilder()
    .setName('start')
    .setDescription('Start your automation session')
    .setDMPermission(false);

  const handler: SlashHandler = async (interaction, ctx) => {
    const correlationId = newCorrelationId();
    const log = ctx.log.child({ op: 'discord.start', correlationId });

    try {
      const input = parseStartInteraction(interaction);
      const account = await deps.lookupAccount.run(input.discordUserId);
      if (!account) {
        throw new AccountNotFoundError('account not found; run /init first');
      }
      const outcome = await deps.startSession.run({
        accountId: account.id,
        actorDiscordUserId: input.discordUserId,
        correlationId,
      });
      await ephemeralReply(interaction, presentStartSuccess(outcome, correlationId));
      log.info({ outcome: 'ok', sessionId: outcome.sessionId }, 'start succeeded');
    } catch (err) {
      log.warn({ outcome: 'error', err }, 'start failed');
      await ephemeralReply(interaction, buildErrorEmbed(err, correlationId));
    }
  };

  return { builder, handler };
}
