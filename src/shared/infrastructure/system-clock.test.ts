import { describe, expect, it } from 'vitest';

import { FixedClock, SystemClock } from './system-clock.js';

describe('SystemClock', () => {
  it('returns a Date close to the actual wall clock', () => {
    const before = Date.now();
    const t = new SystemClock().now().getTime();
    const after = Date.now();
    expect(t).toBeGreaterThanOrEqual(before);
    expect(t).toBeLessThanOrEqual(after);
  });
});

describe('FixedClock', () => {
  it('does not advance on its own', () => {
    const clock = new FixedClock(new Date('2026-01-01T00:00:00Z'));
    const a = clock.now().getTime();
    const b = clock.now().getTime();
    expect(a).toBe(b);
  });

  it('advances on advanceMs', () => {
    const clock = new FixedClock(new Date('2026-01-01T00:00:00Z'));
    clock.advanceMs(1500);
    expect(clock.now().toISOString()).toBe('2026-01-01T00:00:01.500Z');
  });

  it('returns a defensive copy', () => {
    const clock = new FixedClock(new Date('2026-01-01T00:00:00Z'));
    const d = clock.now();
    d.setFullYear(2099);
    expect(clock.now().getUTCFullYear()).toBe(2026);
  });
});
