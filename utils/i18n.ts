import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

import en from '@/locales/en.json';
import tr from '@/locales/tr.json';

export const resources = {
  en: { translation: en },
  tr: { translation: tr },
} as const;

export type AppLocale = keyof typeof resources; // 'en' | 'tr'
export const SUPPORTED_LOCALES: AppLocale[] = ['en', 'tr'];

function getDeviceLocale(): AppLocale {
  const locales = Localization.getLocales();
  const primary = locales[0]?.languageCode ?? 'en';
  return (SUPPORTED_LOCALES as string[]).includes(primary) ? (primary as AppLocale) : 'en';
}

let initialized = false;

export async function initI18n(): Promise<void> {
  if (initialized) return;
  let saved: string | null = null;
  try {
    saved = await AsyncStorage.getItem(STORAGE_KEYS.LOCALE);
  } catch {
    saved = null;
  }
  const lng: AppLocale =
    saved && (SUPPORTED_LOCALES as string[]).includes(saved) ? (saved as AppLocale) : getDeviceLocale();

  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
  initialized = true;
}

export async function changeLocale(locale: AppLocale): Promise<void> {
  await i18n.changeLanguage(locale);
  await AsyncStorage.setItem(STORAGE_KEYS.LOCALE, locale);
}

export async function getSavedLocale(): Promise<AppLocale | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOCALE);
    if (raw && (SUPPORTED_LOCALES as string[]).includes(raw)) return raw as AppLocale;
  } catch {
    return null;
  }
  return null;
}

export default i18n;
