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
};

export const PLATFORM_PATTERNS = {
  youtube: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/,
  reddit: /reddit\.com\/r\/[^\/]+\/comments\/[^\/]+/,
  twitter: /(?:twitter\.com|x\.com)\/[^\/]+\/status\/\d+/,
  github: /github\.com\/[^\/]+\/[^\/]+/,
  instagram: /instagram\.com\/(?:p|reel)\/[^\/]+/,
  medium: /medium\.com\/@?[^\/]+\/[^\/]+/,
};

export const CATEGORY_KEYWORDS = {
  education: ['tutorial', 'learn', 'course', 'guide', 'how to', 'education', 'lecture', 'lesson'],
  entertainment: ['funny', 'meme', 'game', 'music', 'movie', 'show', 'entertainment', 'comedy'],
  code: ['code', 'programming', 'developer', 'github', 'api', 'software', 'tech', 'bug', 'fix'],
  news: ['news', 'breaking', 'update', 'report', 'announcement', 'press'],
};
