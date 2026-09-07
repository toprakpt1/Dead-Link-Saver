export type SnoozePreset = 'tomorrow' | 'days3' | 'week';

export const SNOOZE_MS: Record<SnoozePreset, number> = {
  tomorrow: 24 * 60 * 60 * 1000,
  days3: 3 * 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
};

export const SNOOZE_PRESETS: SnoozePreset[] = ['tomorrow', 'days3', 'week'];

export function resolveSnoozeAt(preset: SnoozePreset, now: number = Date.now()): number {
  return now + SNOOZE_MS[preset];
}
