import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS, MONETIZATION } from '@/utils/constants';

const asyncStorageMock = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
    removeItem: vi.fn(async (key: string) => { store.delete(key); }),
    clear: vi.fn(async () => { store.clear(); }),
  };
});

vi.mock('@react-native-async-storage/async-storage', () => ({ default: asyncStorageMock }));
vi.mock('expo-constants', () => ({
  default: { appOwnership: 'expo', executionEnvironment: undefined },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEntitlementStore } from '@/store/entitlementStore';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

beforeEach(async () => {
  vi.clearAllMocks();
  await asyncStorageMock.clear();
  useEntitlementStore.setState({
    isPro: false,
    isLoading: false,
    isInitialized: false,
    dailyCheck: null,
    weeklyBackup: null,
    rewardedBonus: null,
  });
});

describe('init & entitlement loading', () => {
  it('initializes free users with fresh daily quotas', async () => {
    await useEntitlementStore.getState().init();
    const state = useEntitlementStore.getState();
    expect(state.isPro).toBe(false);
    expect(state.isInitialized).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.dailyCheck).toEqual({ date: todayStr(), count: 0 });
    expect(state.weeklyBackup?.week).toBeTypeOf('string');
    expect(state.rewardedBonus?.count).toBe(0);
  });

  it('restores a stored pro entitlement', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ENTITLEMENT, JSON.stringify({ isPro: true }));
    await useEntitlementStore.getState().init();
    expect(useEntitlementStore.getState().isPro).toBe(true);
  });

  it('resets stale quota dates to the current period', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.QUOTA_DAILY_CHECK,
      JSON.stringify({ date: '2000-01-01', count: 1 })
    );
    await useEntitlementStore.getState().init();
    expect(useEntitlementStore.getState().dailyCheck).toEqual({ date: todayStr(), count: 0 });
  });

  it('setPro persists the entitlement', async () => {
    await useEntitlementStore.getState().setPro(true);
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ENTITLEMENT);
    expect(JSON.parse(raw ?? '')).toEqual({ isPro: true });
    expect(useEntitlementStore.getState().isPro).toBe(true);
  });
});

describe('free daily check limits', () => {
  it('allows one check per day and then blocks', async () => {
    await useEntitlementStore.getState().init();
    const { canCheckDeadLinks, getRemainingChecks } = useEntitlementStore.getState();

    expect(canCheckDeadLinks()).toBe(true);
    expect(getRemainingChecks()).toBe(MONETIZATION.FREE_DAILY_CHECK_LIMIT);

    await useEntitlementStore.getState().consumeCheck();
    expect(useEntitlementStore.getState().canCheckDeadLinks()).toBe(false);
    expect(useEntitlementStore.getState().getRemainingChecks()).toBe(0);

    const raw = await AsyncStorage.getItem(STORAGE_KEYS.QUOTA_DAILY_CHECK);
    expect(JSON.parse(raw ?? '')).toEqual({ date: todayStr(), count: 1 });
  });

  it('pro users are not limited', async () => {
    await useEntitlementStore.getState().setPro(true);
    await useEntitlementStore.getState().consumeCheck();
    expect(useEntitlementStore.getState().canCheckDeadLinks()).toBe(true);
    expect(useEntitlementStore.getState().getRemainingChecks()).toBe(Infinity);
  });
});

describe('free weekly backup limits', () => {
  it('allows one backup per week and then blocks', async () => {
    await useEntitlementStore.getState().init();
    expect(useEntitlementStore.getState().canBackup()).toBe(true);
    await useEntitlementStore.getState().consumeBackup();
    expect(useEntitlementStore.getState().canBackup()).toBe(false);
    expect(useEntitlementStore.getState().getRemainingBackups()).toBe(0);
  });
});

describe('rewarded ads', () => {
  it('grants a bonus that refunds a consumed check', async () => {
    await useEntitlementStore.getState().init();
    await useEntitlementStore.getState().consumeCheck();
    expect(useEntitlementStore.getState().getRewardedRemaining()).toBe(
      MONETIZATION.MAX_REWARDED_PER_DAY
    );

    await useEntitlementStore.getState().grantRewardedBonus('check');
    const state = useEntitlementStore.getState();
    expect(state.dailyCheck?.count).toBe(0);
    expect(state.canCheckDeadLinks()).toBe(true);
    expect(state.rewardedBonus?.count).toBe(1);
    expect(state.getRewardedRemaining()).toBe(MONETIZATION.MAX_REWARDED_PER_DAY - 1);
  });

  it('grants a bonus that refunds a consumed backup', async () => {
    await useEntitlementStore.getState().init();
    await useEntitlementStore.getState().consumeBackup();
    await useEntitlementStore.getState().grantRewardedBonus('backup');
    const state = useEntitlementStore.getState();
    expect(state.weeklyBackup?.count).toBe(0);
    expect(state.canBackup()).toBe(true);
  });

  it('never goes below zero when nothing was consumed', async () => {
    await useEntitlementStore.getState().init();
    await useEntitlementStore.getState().grantRewardedBonus('check');
    expect(useEntitlementStore.getState().dailyCheck?.count).toBe(0);
    expect(useEntitlementStore.getState().rewardedBonus?.count).toBe(1);
  });
});

describe('purchasing', () => {
  it('purchasePro falls back to unlocking pro when purchases are unavailable', async () => {
    await useEntitlementStore.getState().init();
    await expect(useEntitlementStore.getState().purchasePro()).resolves.toBe(true);
    expect(useEntitlementStore.getState().isPro).toBe(true);
  });

  it('restorePurchases reports the current entitlement', async () => {
    await useEntitlementStore.getState().init();
    await expect(useEntitlementStore.getState().restorePurchases()).resolves.toBe(false);
    await useEntitlementStore.getState().setPro(true);
    await expect(useEntitlementStore.getState().restorePurchases()).resolves.toBe(true);
  });
});