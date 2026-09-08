import { themes, type Theme, type ThemeColors } from '@/theme/themes';

const fallback: ThemeColors = themes.midnight.colors;

// Theme resolver, registered by store/themeStore on init. This replaced a
// lazy require() of the store, which created a Metro require cycle
// (themeStore -> constants -> themeStore) with uninitialized-value risk.
type ThemeResolver = () => Theme | null;
let resolveTheme: ThemeResolver | null = null;

export function registerThemeResolver(fn: ThemeResolver): void {
  resolveTheme = fn;
}

function getCurrentColors(): ThemeColors {
  try {
    const theme = resolveTheme?.();
    if (theme?.colors) return theme.colors as ThemeColors;
  } catch {
    // before store init
  }
  return fallback;
}

function getCurrentIsDark(): boolean {
  try {
    const theme = resolveTheme?.();
    if (theme) return theme.isDark;
  } catch {
    return true;
  }
  return true;
}

// Theme-aware COLORS proxy: reads current theme at access time so legacy imports stay themed.
// Exposes `isDark` for style logic (rgba adjustments, etc.).
export const COLORS: ThemeColors = new Proxy(fallback as ThemeColors, {
  get(_target, prop: string) {
    if (prop === 'isDark') return getCurrentIsDark();
    const cur = getCurrentColors();
    const val = (cur as unknown as Record<string, string>)[prop];
    return val ?? (fallback as unknown as Record<string, string>)[prop];
  },
  ownKeys() {
    return Reflect.ownKeys(getCurrentColors());
  },
  getOwnPropertyDescriptor(_t, prop) {
    const cur = getCurrentColors();
    return {
      configurable: true,
      enumerable: true,
      value: (cur as unknown as Record<string, string>)[prop as string],
    };
  },
}) as ThemeColors;

export const FORGOTTEN_DAYS_THRESHOLD = 30;

export const REMINDER_DAYS_THRESHOLD = 14;

// Max chars stored per offline text snapshot (keeps storage reasonable)
export const SNAPSHOT_MAX_CHARS = 60000;

export const STORAGE_KEYS = {
  LINKS: '@dead_link_saver:links',
  SETTINGS: '@dead_link_saver:settings',
  CATEGORIES: '@dead_link_saver:categories',
  COLLECTIONS: '@dead_link_saver:collections',
  ONBOARDING: '@dead_link_saver:onboarding',
  ENTITLEMENT: '@dead_link_saver:entitlement',
  QUOTA_DAILY_CHECK: '@dead_link_saver:quota:daily_check',
  QUOTA_WEEKLY_BACKUP: '@dead_link_saver:quota:weekly_backup',
  REWARDED_BONUS: '@dead_link_saver:rewarded_bonus',
  PRO_TRIAL: '@dead_link_saver:pro_trial',
  COLLECTION_SLOT: '@dead_link_saver:collection_slot',
  THEME: '@dead_link_saver:theme',
  LOCALE: '@dead_link_saver:locale',
};

export const PLATFORM_PATTERNS = {
  youtube: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/,
  reddit: /reddit\.com\/r\/[^\/]+\/comments\/[^\/]+/,
  twitter: /(?:twitter\.com|x\.com)\/[^\/]+\/status\/\d+/,
  github: /github\.com\/[^\/]+\/[^\/]+/,
  instagram: /instagram\.com\/(?:p|reel)\/[^\/]+/,
  medium: /medium\.com\/@?[^\/]+\/[^\/]+/,
  twitch: /twitch\.tv\/[^\/]+/,
  discord: /discord(?:app)?\.com\/invite\/[^\/]+/,
  spotify: /(?:open\.)?spotify\.com\/(?:track|album|playlist|episode|show|artist)\/[a-zA-Z0-9]+/,
  linkedin: /linkedin\.com\/(?:in|company|posts)\/[^\/]+/,
};

export const CATEGORY_KEYWORDS = {
  education: ['tutorial', 'learn', 'course', 'guide', 'how to', 'education', 'lecture', 'lesson'],
  entertainment: ['funny', 'meme', 'game', 'music', 'movie', 'show', 'entertainment', 'comedy'],
  code: ['code', 'programming', 'developer', 'github', 'api', 'software', 'tech', 'bug', 'fix'],
  news: ['news', 'breaking', 'update', 'report', 'announcement', 'press'],
};

// ── Monetization ──
export const MONETIZATION = {
  FREE_DAILY_CHECK_LIMIT: 1,
  FREE_WEEKLY_BACKUP_LIMIT: 1,
  FREE_COLLECTION_LIMIT: 3,
  MAX_REWARDED_PER_DAY: 3,
  PRO_TRIAL_HOURS: 1,
  COLLECTION_SLOT_DAYS: 7,
  ENTITLEMENT_ID: 'pro',
  ADMOB_REWARDED_ID_ANDROID: 'ca-app-pub-3940256099942544/5224354917',
  ADMOB_REWARDED_ID_IOS: 'ca-app-pub-3940256099942544/1712485313',
  BACKUP_FILE_PREFIX: 'dead-link-saver-backup',
} as const;
