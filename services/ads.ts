import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { MONETIZATION } from '@/utils/constants';

let rewardedAd: unknown = null;
let isLoadingAd = false;
let isAdLoaded = false;
let rewardedListenerUnsub: (() => void) | null = null;

interface RewardedAdModule {
  RewardedAd: {
    createForAdRequest: (id: string, options?: unknown) => {
      load: () => void;
      show: () => Promise<void>;
      addAdEventListener: (type: string, cb: () => void) => () => void;
    };
  };
  RewardedAdEventType: Record<string, string>;
  TestIds: { REWARDED: string };
}

function isExpoGo(): boolean {
  // Expo Go has no native Google Mobile Ads module
  const ownership = (Constants as { appOwnership?: string }).appOwnership;
  const executionEnv = (Constants as { executionEnvironment?: string }).executionEnvironment;
  return ownership === 'expo' || executionEnv === 'storeClient';
}

async function getAdMobModule(): Promise<RewardedAdModule | null> {
  if (isExpoGo()) return null;
  try {
    // Platform-specific - not in Expo Go
    const modUnknown: unknown = await import('react-native-google-mobile-ads');
    if (modUnknown && typeof modUnknown === 'object') {
      const hasRewarded = 'RewardedAd' in modUnknown;
      if (hasRewarded) return modUnknown as RewardedAdModule;
    }
    return null;
  } catch {
    return null;
  }
}

function getRewardedId(): string {
  if (__DEV__) {
    return Platform.OS === 'ios' ? MONETIZATION.ADMOB_REWARDED_ID_IOS : MONETIZATION.ADMOB_REWARDED_ID_ANDROID;
  }
  return Platform.OS === 'ios' ? MONETIZATION.ADMOB_REWARDED_ID_IOS : MONETIZATION.ADMOB_REWARDED_ID_ANDROID;
}

export async function initAds(): Promise<void> {
  if (isExpoGo()) {
    console.log('[ads] Expo Go detected - mock mode, ads disabled');
    return;
  }
  try {
    const modUnknown: unknown = await import('react-native-google-mobile-ads');
    if (modUnknown && typeof modUnknown === 'object' && 'default' in modUnknown) {
      const mobileAds = modUnknown.default as { initialize?: () => Promise<void> } | null;
      await mobileAds?.initialize?.();
      console.log('[ads] initialized');
    }
  } catch (e) {
    console.log('[ads] init skipped (Expo Go or not configured)', e);
  }
}

export async function preloadRewarded(): Promise<void> {
  if (isExpoGo()) return;
  if (isLoadingAd || isAdLoaded) return;
  const mod = await getAdMobModule();
  if (!mod) {
    console.log('[ads] AdMob not available, mock mode');
    return;
  }
  try {
    isLoadingAd = true;
    const ad = mod.RewardedAd.createForAdRequest(getRewardedId(), {
      requestNonPersonalizedAdsOnly: true,
    });

    rewardedListenerUnsub?.();
    const unsubLoaded = ad.addAdEventListener(mod.RewardedAdEventType.LOADED, () => {
      isAdLoaded = true;
      isLoadingAd = false;
      console.log('[ads] rewarded loaded');
    });
    const unsubFailed = ad.addAdEventListener(mod.RewardedAdEventType.FAILED_TO_LOAD, () => {
      isAdLoaded = false;
      isLoadingAd = false;
      console.log('[ads] rewarded failed to load');
    });
    const unsubClosed = ad.addAdEventListener(mod.RewardedAdEventType.CLOSED, () => {
      isAdLoaded = false;
      isLoadingAd = false;
      void preloadRewarded();
    });
    rewardedListenerUnsub = () => {
      unsubLoaded();
      unsubFailed();
      unsubClosed();
    };

    rewardedAd = ad;
    ad.load();
  } catch (e) {
    isLoadingAd = false;
    console.log('[ads] preload failed', e);
  }
}

export function isRewardedReady(): boolean {
  return isAdLoaded;
}

export async function showRewarded(): Promise<boolean> {
  if (isExpoGo()) {
    console.log('[ads] Expo Go mock rewarded - granting reward');
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 500);
    });
    return true;
  }

  const mod = await getAdMobModule();

  if (!mod || !rewardedAd) {
    console.log('[ads] mock rewarded - granting reward after 1s delay');
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 900);
    });
    return true;
  }

  try {
    const ad = rewardedAd as {
      show: () => Promise<void>;
      addAdEventListener: (type: string, cb: (payload?: unknown) => void) => () => void;
    };

    let earned = false;

    const unsubEarned = ad.addAdEventListener(mod.RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });

    await ad.show();
    unsubEarned();
    isAdLoaded = false;
    isLoadingAd = false;
    void preloadRewarded();
    return earned;
  } catch (e) {
    console.log('[ads] show failed', e);
    return true;
  }
}

export function getAdsDebugInfo(): string {
  return `ready=${isAdLoaded} loading=${isLoadingAd} hasAd=${!!rewardedAd}`;
}
