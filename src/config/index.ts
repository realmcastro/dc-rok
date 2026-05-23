import { envSchema, type Env } from './env.schema.js';

export type { Env } from './env.schema.js';

export class ConfigError extends Error {
  override readonly name = 'ConfigError';
  constructor(
    message: string,
    readonly issues: readonly string[],
  ) {
    super(message);
  }
}

let cached: Env | null = null;

/**
 * Load and validate environment configuration.
 *
 * This is the single sanctioned reader of `process.env`. Every other module
 * receives values via dependency injection from `src/bootstrap/`.
 */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): Env {
  if (cached) return cached;
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new ConfigError('Invalid environment configuration', issues);
  }
  cached = result.data;
  return cached;
}

/**
 * Reset the cached config. Tests only.
 */
export function __resetConfigCacheForTests(): void {
  cached = null;
}
