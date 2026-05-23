import { PrismaClient } from '@prisma/client';

import type { Logger } from '../shared/index.js';

export function createPrismaClient(log: Logger): PrismaClient {
  const client = new PrismaClient({
    log: [
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });

  client.$on('error', (e) => {
    log.error({ op: 'prisma.error', target: e.target, message: e.message }, 'prisma error');
  });
  client.$on('warn', (e) => {
    log.warn({ op: 'prisma.warn', target: e.target, message: e.message }, 'prisma warn');
  });

  return client;
}
