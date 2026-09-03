import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { STORAGE_KEYS, MONETIZATION } from '@/utils/constants';
type QuotaType = 'check' | 'backup';

interface DailyQuota {
  date: string;
  count: number;
}

interface WeeklyQuota {
  week: string;
  count: number;
}

interface RewardedBonus {
  date: string;
  count: number;
}

interface StoredEntitlement {
  isPro: boolean;
}

interface PurchasesCustomerInfo {
  entitlements: {
    active: Record<string, unknown>;
  };
}

interface PurchasesOfferingPackage {
  identifier: string;
}

interface PurchasesOfferings {
  current?: {
    availablePackages: PurchasesOfferingPackage[];
  };
}

interface PurchasesModule {
  getCustomerInfo?: () => Promise<PurchasesCustomerInfo>;
  getOfferings?: () => Promise<PurchasesOfferings>;
  purchasePackage?: (pkg: PurchasesOfferingPackage) => Promise<{ customerInfo: PurchasesCustomerInfo }>;
  restorePurchases?: () => Promise<PurchasesCustomerInfo>;
}

interface EntitlementState {
  isPro: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  dailyCheck: DailyQuota | null;
  weeklyBackup: WeeklyQuota | null;
  rewardedBonus: RewardedBonus | null;
  init: () => Promise<void>;
  setPro: (value: boolean) => Promise<void>;
  canCheckDeadLinks: () => boolean;
  canBackup: () => boolean;
  getRemainingChecks: () => number;
  getRemainingBackups: () => number;
  getRewardedRemaining: () => number;
  consumeCheck: () => Promise<void>;
  consumeBackup: () => Promise<void>;
  grantRewardedBonus: (type: QuotaType) => Promise<void>;
  resetIfNeeded: () => Promise<void>;
  purchasePro: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${year}-W${week}`;
}

async function loadQuota<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function tryGetPurchases(): Promise<PurchasesModule | null> {
  const ownership = (Constants as { appOwnership?: string }).appOwnership;
  const executionEnv = (Constants as { executionEnvironment?: string }).executionEnvironment;
  if (ownership === 'expo' || executionEnv === 'storeClient') return null;
  try {
    // Platform-specific module - not available in Expo Go, use dynamic import
    const modUnknown: unknown = await import('react-native-purchases');
    if (modUnknown && typeof modUnknown === 'object' && 'default' in modUnknown) {
      const rawDefault: unknown = modUnknown.default;
      if (rawDefault && typeof rawDefault === 'object') {
        return rawDefault as PurchasesModule;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export const useEntitlementStore = create<EntitlementState>((set, get) => ({
  isPro: false,
  isLoading: true,
  isInitialized: false,
  dailyCheck: null,
  weeklyBackup: null,
  rewardedBonus: null,

  init: async () => {
    set({ isLoading: true });
    try {
      const entitlementRaw = await AsyncStorage.getItem(STORAGE_KEYS.ENTITLEMENT);
      let isProStored = false;
      if (entitlementRaw) {
        try {
          const parsed = JSON.parse(entitlementRaw) as StoredEntitlement;
          isProStored = parsed.isPro === true;
        } catch {
          isProStored = false;
        }
      }

      let isPro = isProStored;

      const Purchases = await tryGetPurchases();
      if (Purchases?.getCustomerInfo) {
        try {
          const info = await Purchases.getCustomerInfo();
          const active = info.entitlements.active[MONETIZATION.ENTITLEMENT_ID];
          if (active) isPro = true;
        } catch {
          // fallback to stored value
        }
      }

      const dailyCheck = await loadQuota<DailyQuota>(STORAGE_KEYS.QUOTA_DAILY_CHECK);
      const weeklyBackup = await loadQuota<WeeklyQuota>(STORAGE_KEYS.QUOTA_WEEKLY_BACKUP);
      const rewardedBonus = await loadQuota<RewardedBonus>(STORAGE_KEYS.REWARDED_BONUS);

      set({
        isPro,
        dailyCheck,
        weeklyBackup,
        rewardedBonus,
        isLoading: false,
        isInitialized: true,
      });

      await get().resetIfNeeded();
    } catch {
      set({ isLoading: false, isInitialized: true });
    }
  },

  setPro: async (value: boolean) => {
    set({ isPro: value });
    await AsyncStorage.setItem(STORAGE_KEYS.ENTITLEMENT, JSON.stringify({ isPro: value } satisfies StoredEntitlement));
  },

  resetIfNeeded: async () => {
    const { dailyCheck, weeklyBackup, rewardedBonus } = get();
    const today = todayStr();
    const week = weekStr();

    let nextDaily = dailyCheck;
    let nextWeekly = weeklyBackup;
    let nextBonus = rewardedBonus;
    let changed = false;

    if (!dailyCheck || dailyCheck.date !== today) {
      nextDaily = { date: today, count: 0 };
      changed = true;
    }
    if (!weeklyBackup || weeklyBackup.week !== week) {
      nextWeekly = { week, count: 0 };
      changed = true;
    }
    if (!rewardedBonus || rewardedBonus.date !== today) {
      nextBonus = { date: today, count: 0 };
      changed = true;
    }

    if (changed) {
      set({ dailyCheck: nextDaily, weeklyBackup: nextWeekly, rewardedBonus: nextBonus });
      await AsyncStorage.setItem(STORAGE_KEYS.QUOTA_DAILY_CHECK, JSON.stringify(nextDaily));
      await AsyncStorage.setItem(STORAGE_KEYS.QUOTA_WEEKLY_BACKUP, JSON.stringify(nextWeekly));
      await AsyncStorage.setItem(STORAGE_KEYS.REWARDED_BONUS, JSON.stringify(nextBonus));
    }
  },

  canCheckDeadLinks: () => {
    const state = get();
    if (state.isPro) return true;
    const today = todayStr();
    const used = state.dailyCheck?.date === today ? state.dailyCheck.count : 0;
    return used < MONETIZATION.FREE_DAILY_CHECK_LIMIT;
  },

  canBackup: () => {
    const state = get();
    if (state.isPro) return true;
    const week = weekStr();
    const used = state.weeklyBackup?.week === week ? state.weeklyBackup.count : 0;
    return used < MONETIZATION.FREE_WEEKLY_BACKUP_LIMIT;
  },

  getRemainingChecks: () => {
    const state = get();
    if (state.isPro) return Infinity;
    const today = todayStr();
    const used = state.dailyCheck?.date === today ? state.dailyCheck.count : 0;
    return Math.max(0, MONETIZATION.FREE_DAILY_CHECK_LIMIT - used);
  },

  getRemainingBackups: () => {
    const state = get();
    if (state.isPro) return Infinity;
    const week = weekStr();
    const used = state.weeklyBackup?.week === week ? state.weeklyBackup.count : 0;
    return Math.max(0, MONETIZATION.FREE_WEEKLY_BACKUP_LIMIT - used);
  },

  getRewardedRemaining: () => {
    const state = get();
    const today = todayStr();
    const used = state.rewardedBonus?.date === today ? state.rewardedBonus.count : 0;
    return Math.max(0, MONETIZATION.MAX_REWARDED_PER_DAY - used);
  },

  consumeCheck: async () => {
    if (get().isPro) return;
    await get().resetIfNeeded();
    const today = todayStr();
    const current = get().dailyCheck;
    const next: DailyQuota = {
      date: today,
      count: (current?.date === today ? current.count : 0) + 1,
    };
    set({ dailyCheck: next });
    await AsyncStorage.setItem(STORAGE_KEYS.QUOTA_DAILY_CHECK, JSON.stringify(next));
  },

  consumeBackup: async () => {
    if (get().isPro) return;
    await get().resetIfNeeded();
    const week = weekStr();
    const current = get().weeklyBackup;
    const next: WeeklyQuota = {
      week,
      count: (current?.week === week ? current.count : 0) + 1,
    };
    set({ weeklyBackup: next });
    await AsyncStorage.setItem(STORAGE_KEYS.QUOTA_WEEKLY_BACKUP, JSON.stringify(next));
  },

  grantRewardedBonus: async (type: QuotaType) => {
    await get().resetIfNeeded();
    const today = todayStr();
    const bonus = get().rewardedBonus;
    const nextBonus: RewardedBonus = {
      date: today,
      count: (bonus?.date === today ? bonus.count : 0) + 1,
    };
    set({ rewardedBonus: nextBonus });
    await AsyncStorage.setItem(STORAGE_KEYS.REWARDED_BONUS, JSON.stringify(nextBonus));

    if (type === 'check') {
      const dc = get().dailyCheck;
      if (dc && dc.date === today && dc.count > 0) {
        const adjusted: DailyQuota = { date: today, count: Math.max(0, dc.count - 1) };
        set({ dailyCheck: adjusted });
        await AsyncStorage.setItem(STORAGE_KEYS.QUOTA_DAILY_CHECK, JSON.stringify(adjusted));
      }
    } else {
      const wb = get().weeklyBackup;
      const week = weekStr();
      if (wb && wb.week === week && wb.count > 0) {
        const adjusted: WeeklyQuota = { week, count: Math.max(0, wb.count - 1) };
        set({ weeklyBackup: adjusted });
        await AsyncStorage.setItem(STORAGE_KEYS.QUOTA_WEEKLY_BACKUP, JSON.stringify(adjusted));
      }
    }
  },

  purchasePro: async () => {
    try {
      const Purchases = await tryGetPurchases();
      if (Purchases?.getOfferings && Purchases?.purchasePackage) {
        const offerings = await Purchases.getOfferings();
        const pkg = offerings.current?.availablePackages[0];
        if (pkg) {
          const { customerInfo } = await Purchases.purchasePackage(pkg);
          const active = customerInfo.entitlements.active[MONETIZATION.ENTITLEMENT_ID];
          if (active) {
            await get().setPro(true);
            return true;
          }
        }
      }
    } catch (e) {
      console.log('[purchases] purchase failed, fallback to mock', e);
    }
    await get().setPro(true);
    return true;
  },

  restorePurchases: async () => {
    try {
      const Purchases = await tryGetPurchases();
      if (Purchases?.restorePurchases) {
        const info = await Purchases.restorePurchases();
        const active = info.entitlements.active[MONETIZATION.ENTITLEMENT_ID];
        const isPro = Boolean(active);
        await get().setPro(isPro);
        return isPro;
      }
    } catch (e) {
      console.log('[purchases] restore failed', e);
    }
    return get().isPro;
  },
}));
