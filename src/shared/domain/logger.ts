/**
 * Structured logger. See logging-rules.md.
 *
 * Every log site MUST pass a structured object first, message second.
 *   log.info({ op: 'discord.init', outcome: 'ok' }, 'init completed');
 */
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export type LogPayload = Record<string, unknown>;

export interface Logger {
  fatal(payload: LogPayload, msg?: string): void;
  error(payload: LogPayload, msg?: string): void;
  warn(payload: LogPayload, msg?: string): void;
  info(payload: LogPayload, msg?: string): void;
  debug(payload: LogPayload, msg?: string): void;
  trace(payload: LogPayload, msg?: string): void;

  /**
   * Return a child logger with bound fields (e.g. correlationId).
   */
  child(bindings: LogPayload): Logger;
}
