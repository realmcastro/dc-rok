import { describe, expect, it } from 'vitest';

import { SequenceIdGenerator, UlidIdGenerator } from './ulid-id-generator.js';

describe('UlidIdGenerator', () => {
  it('produces 26-char ULIDs', () => {
    const gen = new UlidIdGenerator();
    const id = gen.next();
    expect(id).toHaveLength(26);
    expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it('produces unique values', () => {
    const gen = new UlidIdGenerator();
    const set = new Set(Array.from({ length: 1000 }, () => gen.next()));
    expect(set.size).toBe(1000);
  });
});

describe('SequenceIdGenerator', () => {
  it('is deterministic and unique', () => {
    const gen = new SequenceIdGenerator();
    expect(gen.next()).not.toBe(gen.next());
    const fresh = new SequenceIdGenerator();
    const first = fresh.next();
    expect(first).toHaveLength(26);
    expect(first.startsWith('TEST_')).toBe(true);
    expect(first.endsWith('1')).toBe(true);
  });
});
