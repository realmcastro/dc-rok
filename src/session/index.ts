export { asSessionId, type SessionId } from './domain/session-id.js';
export {
  AutomationSession,
  type AutomationSessionSnapshot,
  type SessionState,
} from './domain/automation-session.js';
export {
  InvalidSessionStateTransitionError,
  SessionNotFoundError,
} from './domain/errors.js';

export type { SessionStateOutcome } from './application/dto/session-outcome.js';
export {
  NoLicenseForAccountError,
  SessionLicenseExpiredError,
  SessionLicenseRevokedError,
} from './application/errors.js';

export type { SessionRepository } from './application/ports/session-repository.js';
export type {
  SessionTxContext,
  SessionUnitOfWork,
} from './application/ports/session-unit-of-work.js';
export type {
  AgentRuntimePort,
  AgentRuntimeStartInput,
  AgentRuntimeStopInput,
} from './application/ports/agent-runtime-port.js';

export {
  StartSession,
  type StartSessionInput,
} from './application/use-cases/start-session.js';
export {
  StopSession,
  type StopSessionInput,
} from './application/use-cases/stop-session.js';
export { GetSessionStatus } from './application/use-cases/get-session-status.js';

export { PrismaSessionRepository } from './infrastructure/prisma-session-repository.js';
export { PrismaSessionUnitOfWork } from './infrastructure/prisma-session-unit-of-work.js';
export { NoopAgentRuntime } from './infrastructure/noop-agent-runtime.js';
export { InMemorySessionRepository } from './infrastructure/in-memory-session-repository.js';
export { InMemorySessionUnitOfWork } from './infrastructure/in-memory-session-unit-of-work.js';
