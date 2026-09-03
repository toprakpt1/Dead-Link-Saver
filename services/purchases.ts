import { Platform } from 'react-native';
import Constants from 'expo-constants';

let purchasesReady = false;

interface PurchasesConfig {
  apiKeyAndroid?: string;
  apiKeyIOS?: string;
}

const FALLBACK_API_KEY_PLACEHOLDER = 'REVENUECAT_API_KEY_PLACEHOLDER';

function isExpoGo(): boolean {
  const ownership = (Constants as { appOwnership?: string }).appOwnership;
  const executionEnv = (Constants as { executionEnvironment?: string }).executionEnvironment;
  return ownership === 'expo' || executionEnv === 'storeClient';
}

export async function initPurchases(config?: PurchasesConfig): Promise<void> {
  if (isExpoGo()) {
    console.log('[purchases] Expo Go - mock mode');
    return;
  }
  const apiKey = Platform.OS === 'ios' ? config?.apiKeyIOS : config?.apiKeyAndroid;

  if (!apiKey || apiKey === FALLBACK_API_KEY_PLACEHOLDER) {
    console.log('[purchases] no API key, mock mode');
    return;
  }

  try {
    const modUnknown: unknown = await import('react-native-purchases');
    if (modUnknown && typeof modUnknown === 'object' && 'default' in modUnknown) {
      const Purchases = modUnknown.default as {
        configure?: (opts: unknown) => void;
        setLogLevel?: (level: unknown) => void;
      };
      if (Purchases.configure) {
        Purchases.configure({ apiKey });
        purchasesReady = true;
        console.log('[purchases] configured');
      }
    }
  } catch (e) {
    console.log('[purchases] init skipped (Expo Go)', e);
  }
}

export function isPurchasesReady(): boolean {
  return purchasesReady;
}
