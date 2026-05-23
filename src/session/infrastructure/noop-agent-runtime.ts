import type { Logger } from '../../shared/index.js';
import type {
  AgentRuntimePort,
  AgentRuntimeStartInput,
  AgentRuntimeStopInput,
} from '../application/ports/agent-runtime-port.js';

/**
 * Phase-1 no-op implementation of `AgentRuntimePort`. ADR-0012.
 *
 * Logs intent and returns. The real Phase-2 implementation will land in a
 * separate adapter under a new ADR. ANY non-no-op behaviour here is forbidden.
 */
export class NoopAgentRuntime implements AgentRuntimePort {
  constructor(private readonly log: Logger) {}

  start(input: AgentRuntimeStartInput): Promise<void> {
    this.log.info(
      {
        op: 'agent-runtime.start',
        adapter: 'noop',
        accountId: input.accountId,
        sessionId: input.sessionId,
        correlationId: input.correlationId,
      },
      'noop agent runtime: start intent recorded',
    );
    return Promise.resolve();
  }

  stop(input: AgentRuntimeStopInput): Promise<void> {
    this.log.info(
      {
        op: 'agent-runtime.stop',
        adapter: 'noop',
        accountId: input.accountId,
        sessionId: input.sessionId,
        correlationId: input.correlationId,
      },
      'noop agent runtime: stop intent recorded',
    );
    return Promise.resolve();
  }
}
