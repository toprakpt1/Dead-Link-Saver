import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppSettings } from '@/store/types';

const storageMock = vi.hoisted(() => ({
  saveLinks: vi.fn(async () => {}),
  loadLinks: vi.fn(async () => []),
  saveSettings: vi.fn(async (_settings: AppSettings) => {}),
  loadSettings: vi.fn(async (): Promise<AppSettings> => ({ cardSize: 'medium' })),
  clearAll: vi.fn(async () => {}),
}));

vi.mock('@/utils/storage', () => ({ storage: storageMock }));

import { useSettingsStore } from '@/store/settingsStore';

beforeEach(() => {
  vi.clearAllMocks();
  useSettingsStore.setState({ cardSize: 'medium', loaded: false });
});

describe('settingsStore', () => {
  it('starts with the default card size', () => {
    expect(useSettingsStore.getState().cardSize).toBe('medium');
  });

  it('loadSettings applies the stored card size', async () => {
    storageMock.loadSettings.mockResolvedValueOnce({ cardSize: 'large' });
    await useSettingsStore.getState().loadSettings();
    expect(useSettingsStore.getState().cardSize).toBe('large');
    expect(useSettingsStore.getState().loaded).toBe(true);
  });

  it('setCardSize updates state and persists', async () => {
    useSettingsStore.getState().setCardSize('small');
    expect(useSettingsStore.getState().cardSize).toBe('small');
    expect(storageMock.saveSettings).toHaveBeenCalledWith({ cardSize: 'small' });
  });
});