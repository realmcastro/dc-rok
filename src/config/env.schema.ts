import { z } from 'zod';

const nonEmptyString = z.string().trim().min(1);

const csvDiscordIds = z
  .string()
  .default('')
  .transform((raw) =>
    raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  )
  .pipe(z.array(z.string().regex(/^\d{17,20}$/, 'invalid Discord user id')));

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: nonEmptyString,
  DATABASE_MIGRATION_URL: nonEmptyString.optional(),

  DISCORD_TOKEN: nonEmptyString,
  DISCORD_APP_ID: nonEmptyString,
  DISCORD_DEV_GUILD_ID: nonEmptyString.optional(),

  ADMIN_DISCORD_USER_IDS: csvDiscordIds,

  RATE_LIMIT_INIT_PER_MIN: z.coerce.number().int().positive().default(5),

  /**
   * Pepper for HMAC-based license/activation-code hashing.
   * Must be >= 32 bytes of entropy (hex or base64). Rotation requires a
   * documented migration plan (see security-rules.md).
   */
  LICENSE_HASH_PEPPER: z.string().min(32, 'LICENSE_HASH_PEPPER must be >= 32 chars'),
});

export type Env = z.infer<typeof envSchema>;
