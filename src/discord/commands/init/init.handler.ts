import { SlashCommandBuilder } from 'discord.js';

import type { LinkAccount } from '../../../account-link/index.js';
import { newCorrelationId } from '../../../shared/index.js';
import { buildErrorEmbed } from '../../presenters/error.js';
import { ephemeralReply } from '../../runtime/reply.js';
import type { SlashCommand, SlashHandler } from '../../runtime/slash-handler.js';
import { parseInitInteraction } from './init.parser.js';
import { presentInitSuccess } from './init.presenter.js';

export interface InitCommandDeps {
  readonly linkAccount: LinkAccount;
}

export function makeInitCommand(deps: InitCommandDeps): SlashCommand {
  const builder = new SlashCommandBuilder()
    .setName('init')
    .setDescription('Link your Discord account using an activation code')
    .addStringOption((opt) =>
      opt.setName('code').setDescription('Your activation code').setRequired(true),
    )
    .setDMPermission(false);

  const handler: SlashHandler = async (interaction, ctx) => {
    const correlationId = newCorrelationId();
    const log = ctx.log.child({ op: 'discord.init', correlationId });

    try {
      const input = parseInitInteraction(interaction);
      const outcome = await deps.linkAccount.run({
        code: input.code,
        discordUserId: input.discordUserId,
        externalAccountName: input.externalAccountName,
        correlationId,
      });
      await ephemeralReply(interaction, presentInitSuccess(outcome, correlationId));
      log.info({ outcome: 'ok', accountId: outcome.accountId }, 'init succeeded');
    } catch (err) {
      log.warn({ outcome: 'error', err }, 'init failed');
      await ephemeralReply(interaction, buildErrorEmbed(err, correlationId));
    }
  };

  return { builder, handler };
}
