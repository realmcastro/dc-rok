import type { QueryClient } from '@tanstack/react-query';
import { on } from './ipc';
import { IPC, type LogLine } from '@shared/ipc-contract';

/**
 * Maps bot log `op` codes to the query keys that should be invalidated when
 * that op fires. The bot logs structured Pino lines (e.g. `op: 'account.link'`)
 * inside its use-cases — those are our change signal.
 *
 * Adding a new op:
 *  1. ensure the bot logs `op: '<name>'` inside the relevant use-case
 *  2. add the mapping below
 */
const OP_TO_KEYS: Record<string, ReadonlyArray<readonly string[]>> = {
  // account-link
  'account.link': [['accounts'], ['codes'], ['licenses'], ['sessions'], ['dashboard']],
  'account.reset': [['accounts'], ['sessions'], ['dashboard']],

  // license
  'license.issue': [['licenses'], ['codes'], ['dashboard']],
  'license.revoke': [['licenses'], ['dashboard']],
  'code.create': [['codes'], ['dashboard']],
  'code.redeem': [['codes'], ['licenses'], ['accounts'], ['dashboard']],

  // session
  'session.start': [['sessions'], ['dashboard']],
  'session.stop': [['sessions'], ['dashboard']],

  // discord command handlers (broader fallback — also touch dashboard)
  'discord.init': [['accounts'], ['codes'], ['dashboard'], ['sessions']],
  'discord.reset': [['accounts'], ['sessions'], ['dashboard']],
  'discord.start': [['sessions'], ['dashboard']],
  'discord.stop': [['sessions'], ['dashboard']],
  'discord.status': [['sessions']],
};

/**
 * Wires backend log + status events into React Query invalidations.
 * Returns an unsubscribe function.
 */
export function attachLiveSync(qc: QueryClient): () => void {
  const offs: Array<() => void> = [];

  offs.push(
    on(IPC.backendLogEvent, (data) => {
      const line = data as LogLine;
      const op = readOp(line);
      if (!op) return;
      // Only invalidate on successful or completed ops, not on every debug line.
      // We accept all info/warn/error here; React Query dedupes refetches.
      const keys = OP_TO_KEYS[op];
      if (!keys) return;
      for (const key of keys) {
        void qc.invalidateQueries({ queryKey: [...key] });
      }
    }),
  );

  offs.push(
    on(IPC.backendStatusEvent, () => {
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    }),
  );

  return () => {
    for (const off of offs) off();
  };
}

function readOp(line: LogLine): string | null {
  const p = line.parsed;
  if (!p) return null;
  const op = p['op'];
  return typeof op === 'string' ? op : null;
}
