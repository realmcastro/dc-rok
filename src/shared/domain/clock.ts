/**
 * Time source. Injected everywhere; never call Date.now() directly.
 */
export interface Clock {
  now(): Date;
}
