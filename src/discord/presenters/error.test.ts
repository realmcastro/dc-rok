import { describe, expect, it } from 'vitest';

import {
  DiscordUserAlreadyLinkedError,
} from '../../account-link/index.js';
import {
  ActivationCodeAlreadyRedeemedError,
  ActivationCodeNotFoundError,
  LicenseExhaustedError,
  LicenseExpiredError,
} from '../../license/index.js';
import { asCorrelationId, InvalidInputError } from '../../shared/index.js';
import { buildErrorEmbed } from './error.js';

const CORR = asCorrelationId('01CORR000000000000000000AA');

describe('buildErrorEmbed', () => {
  it.each([
    [new InvalidInputError('bad'), 'Invalid input'],
    [new ActivationCodeNotFoundError('x'), 'Activation code not found'],
    [new ActivationCodeAlreadyRedeemedError('x'), 'Code already used'],
    [new LicenseExpiredError('x'), 'License expired'],
    [new LicenseExhaustedError('x'), 'License exhausted'],
    [new DiscordUserAlreadyLinkedError('x'), 'Already linked'],
  ])('maps %s to a friendly title', (err, expectedTitle) => {
    const embed = buildErrorEmbed(err, CORR);
    expect(embed.data.title).toBe(expectedTitle);
  });

  it('collapses unknown errors to a generic message', () => {
    const embed = buildErrorEmbed(new Error('oops'), CORR);
    expect(embed.data.title).toBe('Something went wrong');
    expect(embed.data.description).not.toContain('oops');
  });

  it('does not leak internal infrastructure error messages', () => {
    class FakeInfra extends Error {
      readonly kind = 'infrastructure' as const;
      readonly code = 'DEPENDENCY_FAILURE';
    }
    const embed = buildErrorEmbed(new FakeInfra('db down at 10.0.0.5'), CORR);
    expect(embed.data.description).not.toContain('10.0.0.5');
  });

  it('embed footer carries the correlation suffix', () => {
    const embed = buildErrorEmbed(new InvalidInputError('bad'), CORR);
    expect(embed.data.footer?.text).toMatch(/^ref [A-Z0-9]{6}$/);
  });
});
