import { describe, expect, it } from 'vitest';

import {
  ConflictError,
  DependencyError,
  InvalidInputError,
  NotFoundError,
  isAppError,
} from './errors.js';

describe('errors', () => {
  it('InvalidInputError is a domain error', () => {
    const e = new InvalidInputError('bad code', { metadata: { field: 'code' } });
    expect(e.kind).toBe('domain');
    expect(e.code).toBe('INVALID_INPUT');
    expect(e.metadata).toEqual({ field: 'code' });
    expect(e.name).toBe('InvalidInputError');
    expect(isAppError(e)).toBe(true);
  });

  it('DependencyError is an infrastructure error', () => {
    const cause = new Error('boom');
    const e = new DependencyError('db down', { cause });
    expect(e.kind).toBe('infrastructure');
    expect(e.code).toBe('DEPENDENCY_FAILURE');
    expect(e.cause).toBe(cause);
  });

  it('freezes metadata', () => {
    const e = new ConflictError('dup');
    expect(Object.isFrozen(e.metadata)).toBe(true);
  });

  it('isAppError rejects plain errors', () => {
    expect(isAppError(new Error('x'))).toBe(false);
    expect(isAppError(null)).toBe(false);
  });

  it('NotFoundError exposes expected code', () => {
    expect(new NotFoundError('x').code).toBe('NOT_FOUND');
  });
});
