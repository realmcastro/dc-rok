import { ulid } from 'ulid';

import type { IdGenerator } from '../domain/id-generator.js';

export class UlidIdGenerator implements IdGenerator {
  next(): string {
    return ulid();
  }
}

/**
 * Deterministic generator for tests.
 */
export class SequenceIdGenerator implements IdGenerator {
  private counter = 0;

  constructor(private readonly prefix = 'TEST_') {}

  next(): string {
    this.counter += 1;
    return `${this.prefix}${String(this.counter).padStart(26 - this.prefix.length, '0')}`;
  }
}
