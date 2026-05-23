import { isAppError, type CorrelationId } from '../../shared/index.js';

import { buildEmbed } from './embed.js';

interface UserFacingError {
  readonly title: string;
  readonly description: string;
}

/**
 * Translate a typed error to a friendly, sanitized message. Unknown errors
 * collapse to a generic message so internal details never leak.
 */
function describe(err: unknown): UserFacingError {
  if (isAppError(err)) {
    switch (err.code) {
      case 'INVALID_INPUT':
        return { title: 'Invalid input', description: err.message };
      case 'ACTIVATION_CODE_NOT_FOUND':
        return {
          title: 'Activation code not found',
          description: 'Double-check the code and try again.',
        };
      case 'ACTIVATION_CODE_ALREADY_REDEEMED':
        return {
          title: 'Code already used',
          description: 'That activation code has already been redeemed.',
        };
      case 'LICENSE_EXPIRED':
        return { title: 'License expired', description: 'Contact an admin to renew.' };
      case 'LICENSE_REVOKED':
        return { title: 'License revoked', description: 'Contact an admin for details.' };
      case 'LICENSE_EXHAUSTED':
        return {
          title: 'License exhausted',
          description: 'No remaining activations on this license.',
        };
      case 'DISCORD_USER_ALREADY_LINKED':
        return {
          title: 'Already linked',
          description:
            'Your Discord account is already linked. Use `/reset` first if you want to relink.',
        };
      case 'ACCOUNT_NOT_FOUND':
        return { title: 'Account not found', description: 'Run `/init` to set up your account.' };
      case 'ACCOUNT_SUSPENDED':
        return { title: 'Account suspended', description: 'Contact an admin for details.' };
      case 'NO_LICENSE_FOR_ACCOUNT':
        return {
          title: 'No active license',
          description: 'Run `/init` with an activation code, or contact an admin.',
        };
      case 'SESSION_NOT_FOUND':
        return {
          title: 'No session yet',
          description: 'Run `/start` first.',
        };
      case 'INVALID_SESSION_STATE_TRANSITION':
        return {
          title: 'Cannot do that right now',
          description: 'The session is not in a state that allows this action.',
        };
      case 'PERMISSION_DENIED':
        return {
          title: 'Permission denied',
          description: 'You do not have access to this command.',
        };
      case 'RATE_LIMITED':
        return { title: 'Slow down', description: 'Try again in a minute.' };
      default:
        if (err.kind === 'domain') {
          return { title: 'Request rejected', description: err.message };
        }
        return {
          title: 'Something went wrong',
          description: 'A transient error occurred. Please try again.',
        };
    }
  }
  return {
    title: 'Something went wrong',
    description: 'An unexpected error occurred.',
  };
}

export function buildErrorEmbed(err: unknown, correlationId: CorrelationId) {
  const { title, description } = describe(err);
  return buildEmbed({ kind: 'error', title, description, correlationId });
}
