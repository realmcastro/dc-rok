import { ulid } from 'ulid';

import { asCorrelationId, type CorrelationId } from '../domain/correlation-id.js';

export function newCorrelationId(): CorrelationId {
  return asCorrelationId(ulid());
}
