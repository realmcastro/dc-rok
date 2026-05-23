import pino, { type Logger as PinoBaseLogger } from 'pino';

import type { Logger, LogLevel, LogPayload } from '../domain/logger.js';

interface CreatePinoLoggerOptions {
  level: LogLevel;
  pretty: boolean;
  base?: LogPayload;
}

/**
 * Build the root Pino logger. Production = JSON; development = pino-pretty.
 *
 * Secrets MUST NOT appear in log payloads. See logging-rules.md and security-rules.md.
 */
export function createPinoLogger(opts: CreatePinoLoggerOptions): Logger {
  const transport = opts.pretty
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

  const root = pino({
    level: opts.level,
    base: opts.base ?? {},
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        'token',
        '*.token',
        'password',
        '*.password',
        'authorization',
        '*.authorization',
        'licenseKey',
        '*.licenseKey',
        'activationCode',
        '*.activationCode',
      ],
      censor: '[REDACTED]',
    },
    ...(transport ? { transport } : {}),
  });

  return wrap(root);
}

function wrap(p: PinoBaseLogger): Logger {
  return {
    fatal: (payload, msg) => {
      p.fatal(payload, msg);
    },
    error: (payload, msg) => {
      p.error(payload, msg);
    },
    warn: (payload, msg) => {
      p.warn(payload, msg);
    },
    info: (payload, msg) => {
      p.info(payload, msg);
    },
    debug: (payload, msg) => {
      p.debug(payload, msg);
    },
    trace: (payload, msg) => {
      p.trace(payload, msg);
    },
    child: (bindings) => wrap(p.child(bindings)),
  };
}
