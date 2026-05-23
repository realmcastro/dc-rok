import { describe, expect, it } from 'vitest';

import { RandomActivationCodeFactory } from './random-activation-code-factory.js';

describe('RandomActivationCodeFactory', () => {
  const factory = new RandomActivationCodeFactory();

  it('produces 5-char groups separated by dashes', () => {
    const code = factory.generate();
    expect(code).toMatch(/^[A-HJKMNP-Z2-9]{5}-[A-HJKMNP-Z2-9]{5}-[A-HJKMNP-Z2-9]{5}-[A-HJKMNP-Z2-9]{5}$/);
  });

  it('produces distinct values across many calls', () => {
    const codes = new Set(Array.from({ length: 1000 }, () => factory.generate()));
    expect(codes.size).toBe(1000);
  });
});
