import { enUS, de, fr, es, pt, it, ru, ar, hi, ja, ko, tr, type Locale } from 'date-fns/locale';
import type { AppLocale } from './i18n';

const DATE_LOCALES: Record<AppLocale, Locale> = {
  en: enUS,
  tr,
  de,
  fr,
  es,
  pt,
  it,
  ru,
  ar,
  hi,
  ja,
  ko,
};

export function getDateFnsLocale(code: string): Locale {
  return (DATE_LOCALES as Record<string, Locale>)[code] ?? enUS;
}
