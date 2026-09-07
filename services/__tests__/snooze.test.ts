import { describe, expect, it } from 'vitest';
import { resolveSnoozeAt, SNOOZE_MS, type SnoozePreset } from '@/services/snooze';

describe('resolveSnoozeAt', () => {
  const cases: { preset: SnoozePreset; ms: number }[] = [
    { preset: 'tomorrow', ms: 24 * 60 * 60 * 1000 },
    { preset: 'days3', ms: 3 * 24 * 60 * 60 * 1000 },
    { preset: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
  ];

  for (const { preset, ms } of cases) {
    it(`schedules ${preset} exactly ${ms}ms out`, () => {
      expect(resolveSnoozeAt(preset, 1_000)).toBe(1_000 + ms);
      expect(SNOOZE_MS[preset]).toBe(ms);
    });
  }

  it('defaults to now', () => {
    const before = Date.now();
    const at = resolveSnoozeAt('tomorrow');
    expect(at).toBeGreaterThanOrEqual(before + SNOOZE_MS.tomorrow);
  });
});
