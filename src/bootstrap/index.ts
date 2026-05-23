/**
 * Composition root.
 *
 * The ONLY file allowed to:
 *   - read environment via `loadConfig()`
 *   - construct infrastructure adapters
 *   - wire modules together
 *
 * No business logic here. Everything else in src/ depends on injected deps.
 */

import { ConfigError, loadConfig } from '../config/index.js';
import { makeInitCommand } from '../discord/commands/init/init.handler.js';
import { makeResetCommand } from '../discord/commands/reset/reset.handler.js';
import { makeStartCommand } from '../discord/commands/start/start.handler.js';
import { makeStatusCommand } from '../discord/commands/status/status.handler.js';
import { makeStopCommand } from '../discord/commands/stop/stop.handler.js';
import { startBot } from '../discord/runtime/client.js';
import type { SlashCommand } from '../discord/runtime/slash-handler.js';
import { createPinoLogger } from '../shared/index.js';

import { buildContainer } from './container.js';
import { createPrismaClient } from './prisma.js';

async function main(): Promise<void> {
  const env = (() => {
    try {
      return loadConfig();
    } catch (e) {
      if (e instanceof ConfigError) {
        console.error('FATAL: invalid configuration', { issues: e.issues });
      } else {
        console.error('FATAL: failed to load configuration', e);
      }
      process.exit(1);
    }
  })();

  const earlyLog = createPinoLogger({
    level: env.LOG_LEVEL,
    pretty: env.NODE_ENV === 'development',
    base: { service: 'dc-rok', env: env.NODE_ENV, stage: 'prisma-init' },
  });

  const prisma = createPrismaClient(earlyLog);
  await prisma.$connect();

  const container = buildContainer({ env, prisma });
  const { log } = container;

  log.info({ op: 'bootstrap.start', node: process.version }, 'starting');

  const commands: SlashCommand[] = [
    makeInitCommand({ linkAccount: container.useCases.linkAccount }),
    makeResetCommand({
      lookupAccount: container.useCases.lookupAccount,
      resetAccount: container.useCases.resetAccount,
    }),
    makeStartCommand({
      lookupAccount: container.useCases.lookupAccount,
      startSession: container.useCases.startSession,
    }),
    makeStatusCommand({
      lookupAccount: container.useCases.lookupAccount,
      getSessionStatus: container.useCases.getSessionStatus,
    }),
    makeStopCommand({
      lookupAccount: container.useCases.lookupAccount,
      stopSession: container.useCases.stopSession,
    }),
  ];

  const client = await startBot({
    config: {
      token: env.DISCORD_TOKEN,
      applicationId: env.DISCORD_APP_ID,
      ...(env.DISCORD_DEV_GUILD_ID ? { devGuildId: env.DISCORD_DEV_GUILD_ID } : {}),
    },
    commands,
    log,
  });

  const shutdown = (signal: NodeJS.Signals): void => {
    log.info({ op: 'bootstrap.shutdown', signal }, 'shutting down');
    void (async () => {
      try {
        await client.destroy();
        await prisma.$disconnect();
      } catch (err) {
        log.error({ op: 'bootstrap.shutdown', err }, 'shutdown error');
      } finally {
        process.exit(0);
      }
    })();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  log.info({ op: 'bootstrap.ready' }, 'ready');
}

main().catch((e: unknown) => {
  console.error('FATAL: unhandled error in bootstrap', e);
  process.exit(1);
});
