import {
  ComponentType,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';

import {
  AccountNotFoundError,
  type LookupAccountByDiscordUser,
  type ResetAccount,
} from '../../../account-link/index.js';
import { newCorrelationId } from '../../../shared/index.js';
import { buildErrorEmbed } from '../../presenters/error.js';
import { ephemeralReply } from '../../runtime/reply.js';
import type { SlashCommand, SlashHandler } from '../../runtime/slash-handler.js';

import { parseResetInteraction } from './reset.parser.js';
import {
  presentResetCancelled,
  presentResetConfirmation,
  presentResetSuccess,
  presentResetTimedOut,
} from './reset.presenter.js';

const CONFIRMATION_TIMEOUT_MS = 15_000;

export interface ResetCommandDeps {
  readonly lookupAccount: LookupAccountByDiscordUser;
  readonly resetAccount: ResetAccount;
}

export function makeResetCommand(deps: ResetCommandDeps): SlashCommand {
  const builder = new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Unlink your account and stop any active session')
    .setContexts(InteractionContextType.Guild);

  const handler: SlashHandler = async (interaction, ctx) => {
    const correlationId = newCorrelationId();
    const log = ctx.log.child({ op: 'discord.reset', correlationId });

    try {
      const input = parseResetInteraction(interaction);

      // Verify account exists before showing confirmation
      const account = await deps.lookupAccount.run(input.discordUserId);
      if (!account) {
        throw new AccountNotFoundError('account not found; run /init first');
      }

      // Show confirmation prompt with buttons
      const { embed, row } = presentResetConfirmation(correlationId);
      const response = await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: MessageFlags.Ephemeral,
        withResponse: true,
      });

      // Await button click
      const message = response.resource?.message;
      if (!message) return;
      try {
        const confirmation = await message.awaitMessageComponent({
          componentType: ComponentType.Button,
          filter: (i) => i.user.id === interaction.user.id,
          time: CONFIRMATION_TIMEOUT_MS,
        });

        if (confirmation.customId === 'reset:confirm') {
          const outcome = await deps.resetAccount.run({
            discordUserId: input.discordUserId,
            correlationId,
          });
          await confirmation.update({
            embeds: [presentResetSuccess(outcome, correlationId)],
            components: [],
          });
          log.info(
            {
              outcome: 'ok',
              accountId: outcome.accountId,
              sessionWasStopped: outcome.sessionWasStopped,
            },
            'reset confirmed',
          );
        } else {
          await confirmation.update({
            embeds: [presentResetCancelled(correlationId)],
            components: [],
          });
          log.info({ outcome: 'cancelled' }, 'reset cancelled');
        }
      } catch {
        // Timeout — no button clicked
        await interaction.editReply({
          embeds: [presentResetTimedOut(correlationId)],
          components: [],
        });
        log.info({ outcome: 'timeout' }, 'reset timed out');
      }
    } catch (err) {
      log.warn({ outcome: 'error', err }, 'reset failed');
      await ephemeralReply(interaction, buildErrorEmbed(err, correlationId));
    }
  };

  return { builder, handler };
}
