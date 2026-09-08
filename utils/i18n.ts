import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

import en from '@/locales/en.json';
import tr from '@/locales/tr.json';
import de from '@/locales/de.json';
import fr from '@/locales/fr.json';
import es from '@/locales/es.json';
import pt from '@/locales/pt.json';
import it from '@/locales/it.json';
import ru from '@/locales/ru.json';
import ar from '@/locales/ar.json';
import hi from '@/locales/hi.json';
import ja from '@/locales/ja.json';
import ko from '@/locales/ko.json';

export const resources = {
  en: { translation: en },
  tr: { translation: tr },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  pt: { translation: pt },
  it: { translation: it },
  ru: { translation: ru },
  ar: { translation: ar },
  hi: { translation: hi },
  ja: { translation: ja },
  ko: { translation: ko },
} as const;

export type AppLocale = keyof typeof resources;
export const SUPPORTED_LOCALES: AppLocale[] = [
  'en',
  'tr',
  'de',
  'fr',
  'es',
  'pt',
  'it',
  'ru',
  'ar',
  'hi',
  'ja',
  'ko',
];

function getDeviceLocale(): AppLocale {
  const locales = Localization.getLocales();
  for (const locale of locales) {
    const candidates = [locale.languageCode, locale.languageTag?.split('-')[0]];
    for (const code of candidates) {
      if (code && (SUPPORTED_LOCALES as string[]).includes(code)) return code as AppLocale;
    }
  }
  return 'en';
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
