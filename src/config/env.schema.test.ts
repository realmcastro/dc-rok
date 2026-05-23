import { describe, expect, it } from 'vitest';

import { envSchema } from './env.schema.js';

describe('envSchema', () => {
  const validBase = {
    NODE_ENV: 'development',
    LOG_LEVEL: 'info',
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    DISCORD_TOKEN: 'token',
    DISCORD_APP_ID: '123',
    ADMIN_DISCORD_USER_IDS: '111111111111111111,222222222222222222',
    RATE_LIMIT_INIT_PER_MIN: '5',
    LICENSE_HASH_PEPPER: 'a'.repeat(32),
  };

  it('parses a valid environment', () => {
    const env = envSchema.parse(validBase);
    expect(env.ADMIN_DISCORD_USER_IDS).toEqual([
      '111111111111111111',
      '222222222222222222',
    ]);
    expect(env.RATE_LIMIT_INIT_PER_MIN).toBe(5);
  });

  it('rejects missing DISCORD_TOKEN', () => {
    const rest: Partial<typeof validBase> = { ...validBase };
    delete rest.DISCORD_TOKEN;
    expect(() => envSchema.parse(rest)).toThrow();
  });

  it('rejects malformed Discord user id in admin list', () => {
    expect(() =>
      envSchema.parse({ ...validBase, ADMIN_DISCORD_USER_IDS: 'not-a-snowflake' }),
    ).toThrow();
  });

  it('treats empty ADMIN_DISCORD_USER_IDS as []', () => {
    const env = envSchema.parse({ ...validBase, ADMIN_DISCORD_USER_IDS: '' });
    expect(env.ADMIN_DISCORD_USER_IDS).toEqual([]);
  });
});
