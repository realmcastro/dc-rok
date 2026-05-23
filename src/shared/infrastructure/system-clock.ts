import type { Clock } from '../domain/clock.js';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/**
 * Test clock. Time advances only on explicit `set` / `advance`.
 */
export class FixedClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return new Date(this.current.getTime());
  }

  set(date: Date): void {
    this.current = new Date(date.getTime());
  }

  advanceMs(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}
