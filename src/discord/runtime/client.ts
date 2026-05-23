import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  type ClientOptions,
  type Interaction,
} from 'discord.js';

import type { Logger } from '../../shared/index.js';

import type { SlashCommand } from './slash-handler.js';

export interface DiscordClientConfig {
  readonly token: string;
  readonly applicationId: string;
  readonly devGuildId?: string;
}

export interface BotDeps {
  readonly config: DiscordClientConfig;
  readonly commands: readonly SlashCommand[];
  readonly log: Logger;
}

/**
 * Bare Discord client. Minimum intents (Guilds only — no message content).
 * See security-rules.md and discord-rules.md.
 */
export function createDiscordClient(): Client {
  const opts: ClientOptions = { intents: [GatewayIntentBits.Guilds] };
  return new Client(opts);
}

export async function registerSlashCommands(
  config: DiscordClientConfig,
  commands: readonly SlashCommand[],
  log: Logger,
): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(config.token);
  const body = commands.map((c) => c.builder.toJSON());

  if (config.devGuildId) {
    await rest.put(Routes.applicationGuildCommands(config.applicationId, config.devGuildId), {
      body,
    });
    log.info(
      { op: 'discord.register', scope: 'guild', guildId: config.devGuildId, count: body.length },
      'slash commands registered (guild scope)',
    );
  } else {
    await rest.put(Routes.applicationCommands(config.applicationId), { body });
    log.info(
      { op: 'discord.register', scope: 'global', count: body.length },
      'slash commands registered (global scope)',
    );
  }
}

export function attachInteractionHandler(
  client: Client,
  commands: readonly SlashCommand[],
  log: Logger,
): void {
  const byName = new Map(commands.map((c) => [c.builder.name, c]));

  client.on('interactionCreate', (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = byName.get(interaction.commandName);
    if (!command) {
      log.warn({ op: 'discord.dispatch', commandName: interaction.commandName }, 'unknown command');
      return;
    }
    void command.handler(interaction, { log }).catch((err: unknown) => {
      log.error(
        { op: 'discord.dispatch', commandName: interaction.commandName, err },
        'handler threw',
      );
    });
  });
}

export async function startBot(deps: BotDeps): Promise<Client> {
  const client = createDiscordClient();
  attachInteractionHandler(client, deps.commands, deps.log);

  client.once('ready', (c) => {
    deps.log.info({ op: 'discord.ready', userTag: c.user.tag }, 'discord client ready');
  });

  await registerSlashCommands(deps.config, deps.commands, deps.log);
  await client.login(deps.config.token);
  return client;
}
