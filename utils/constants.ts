export const COLORS = {
  background: '#0a0e27',
  surface: '#151b3d',
  primary: '#6c8eff',
  secondary: '#a78bfa',
  accent: '#f472b6',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  border: '#1e293b',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
};

export const FORGOTTEN_DAYS_THRESHOLD = 30;

export const STORAGE_KEYS = {
  LINKS: '@dead_link_saver:links',
  SETTINGS: '@dead_link_saver:settings',
  CATEGORIES: '@dead_link_saver:categories',
  ONBOARDING: '@dead_link_saver:onboarding',
  ENTITLEMENT: '@dead_link_saver:entitlement',
  QUOTA_DAILY_CHECK: '@dead_link_saver:quota:daily_check',
  QUOTA_WEEKLY_BACKUP: '@dead_link_saver:quota:weekly_backup',
  REWARDED_BONUS: '@dead_link_saver:rewarded_bonus',
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
  // Free tier quotas
  FREE_DAILY_CHECK_LIMIT: 1,
  FREE_WEEKLY_BACKUP_LIMIT: 1,
  // Rewarded caps (spam guard)
  MAX_REWARDED_PER_DAY: 3,
  // RevenueCat
  ENTITLEMENT_ID: 'pro',
  // AdMob - replace with real IDs before production
  ADMOB_REWARDED_ID_ANDROID: 'ca-app-pub-3940256099942544/5224354917', // test id
  ADMOB_REWARDED_ID_IOS: 'ca-app-pub-3940256099942544/1712485313', // test id
  // Backup
  BACKUP_FILE_PREFIX: 'dead-link-saver-backup',
} as const;
