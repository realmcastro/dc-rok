import type { ChatInputCommandInteraction } from 'discord.js';
import { describe, expect, it } from 'vitest';

import { InvalidInputError } from '../../../shared/index.js';

import { parseInitInteraction } from './init.parser.js';

function makeInteraction(opts: {
  code?: string;
  username?: string;
  discordUserId?: string;
}): ChatInputCommandInteraction {
  const code = opts.code;
  const userId = opts.discordUserId ?? '111111111111111111';
  const username = opts.username ?? 'alice';
  return {
    options: {
      getString(name: string, required: boolean): string | null {
        if (name !== 'code') return null;
        if (code === undefined) {
          if (required) throw new Error('missing required string option: code');
          return null;
        }
        return code;
      },
    },
    user: { id: userId, username },
    member: { user: { id: userId, username } },
  } as unknown as ChatInputCommandInteraction;
}

describe('parseInitInteraction', () => {
  it('extracts code + discordUserId + externalAccountName', () => {
    const input = parseInitInteraction(
      makeInteraction({ code: 'ABCDE-FGHIJ-KLMNO-PQRST', username: 'alice' }),
    );
    expect(input.code).toBe('ABCDE-FGHIJ-KLMNO-PQRST');
    expect(input.discordUserId).toBe('111111111111111111');
    expect(input.externalAccountName).toBe('alice');
  });

  it('trims surrounding whitespace from the code', () => {
    const input = parseInitInteraction(makeInteraction({ code: '  ABCDE  ', username: 'alice' }));
    expect(input.code).toBe('ABCDE');
  });

  it('rejects empty code', () => {
    expect(() => parseInitInteraction(makeInteraction({ code: '   ', username: 'alice' }))).toThrow(
      InvalidInputError,
    );
  });

  it('rejects an oversized code', () => {
    expect(() =>
      parseInitInteraction(makeInteraction({ code: 'A'.repeat(100), username: 'alice' })),
    ).toThrow(InvalidInputError);
  });
});
