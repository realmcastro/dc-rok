import type { ActivationCodeRepository } from './activation-code-repository.js';
import type { LicenseRepository } from './license-repository.js';

export interface LicenseTxContext {
  readonly licenses: LicenseRepository;
  readonly codes: ActivationCodeRepository;
}

/**
 * Atomically reads + writes across the license + activation-code aggregates.
 *
 * Implementations open one DB transaction per `run()`; nested calls are forbidden.
 */
export interface LicenseUnitOfWork {
  run<T>(callback: (tx: LicenseTxContext) => Promise<T>): Promise<T>;
}
