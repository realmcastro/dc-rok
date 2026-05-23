/**
 * Deterministic hasher for license keys and activation codes.
 *
 * Implementations MUST be deterministic (same input → same output) so that
 * lookups by hash work. Salt with a server-side pepper (never per-row salts).
 */
export interface LicenseHasher {
  hash(plaintext: string): string;
}
