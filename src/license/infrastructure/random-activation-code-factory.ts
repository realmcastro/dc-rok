import { randomBytes } from 'node:crypto';

import type { ActivationCodeFactory } from '../application/ports/activation-code-factory.js';

/**
 * Crockford-base32-ish alphabet (no 0/O/1/I, no profanity-prone chars).
 * 20 chars -> ~100 bits of entropy. Easy to type, hard to brute-force.
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 20;

export class RandomActivationCodeFactory implements ActivationCodeFactory {
  generate(): string {
    const bytes = randomBytes(CODE_LENGTH);
    let out = '';
    for (let i = 0; i < CODE_LENGTH; i += 1) {
      const byte = bytes[i] ?? 0;
      out += ALPHABET[byte % ALPHABET.length] ?? 'A';
    }
    // Format as 5-char groups for readability: XXXXX-XXXXX-XXXXX-XXXXX
    return `${out.slice(0, 5)}-${out.slice(5, 10)}-${out.slice(10, 15)}-${out.slice(15, 20)}`;
  }
}
