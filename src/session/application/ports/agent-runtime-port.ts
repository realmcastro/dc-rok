import type { CorrelationId } from '../../../shared/index.js';
import type { SessionId } from '../../domain/session-id.js';

/**
 * PHASE-2 SEAM (ADR-0012).
 *
 * The Phase-1 implementation is `NoopAgentRuntime` — it logs intent and returns.
 * Real game automation lands here in Phase 2 via a separate adapter and an
 * explicit ADR. Until then, ANY non-no-op implementation is forbidden by the
 * `scope-enforcer` agent.
 */
export interface AgentRuntimeStartInput {
  readonly accountId: string;
  readonly sessionId: SessionId;
  readonly correlationId: CorrelationId;
}

export interface AgentRuntimeStopInput {
  readonly accountId: string;
  readonly sessionId: SessionId;
  readonly correlationId: CorrelationId;
}

export interface AgentRuntimePort {
  start(input: AgentRuntimeStartInput): Promise<void>;
  stop(input: AgentRuntimeStopInput): Promise<void>;
}
