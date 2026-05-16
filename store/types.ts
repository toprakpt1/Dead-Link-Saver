export type LinkPlatform = 'youtube' | 'reddit' | 'twitter' | 'article' | 'github' | 'instagram' | 'medium' | 'unknown';

export type LinkCategory = string;

export type LinkStatus = 'unread' | 'watched' | 'saved';

export type CardSize = 'small' | 'medium' | 'large';

export interface AppSettings {
  cardSize: CardSize;
}

export const DEFAULT_SETTINGS: AppSettings = {
  cardSize: 'medium',
};

export interface LinkMetadata {
  title: string;
  description?: string;
  thumbnail?: string;
  author?: string;
  publishedDate?: string;
}

export interface SavedLink {
  id: string;
  url: string;
  platform: LinkPlatform;
  category: LinkCategory;
  status: LinkStatus;
  metadata: LinkMetadata;
  isDead: boolean;
  archiveUrl?: string;
  isFavorite: boolean;
  createdAt: number;
  lastOpenedAt?: number;
  openCount: number;
}

export interface LinkStore {
  links: SavedLink[];
  isLoading: boolean;
  addLink: (url: string) => Promise<void>;
  removeLink: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateStatus: (id: string, status: LinkStatus) => void;
  updateLinkCategory: (id: string, category: LinkCategory) => void;
  markAsOpened: (id: string) => void;
  checkDeadLinks: () => Promise<string[]>;
  getForgottenLinks: () => SavedLink[];
  loadLinks: () => Promise<void>;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  keywords: string[];
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'education', name: 'Education', color: '#10b981', keywords: ['tutorial', 'learn', 'course', 'guide', 'how to', 'education', 'lecture', 'lesson'] },
  { id: 'entertainment', name: 'Entertainment', color: '#f472b6', keywords: ['funny', 'meme', 'game', 'music', 'movie', 'show', 'entertainment', 'comedy'] },
  { id: 'code', name: 'Code', color: '#6c8eff', keywords: ['code', 'programming', 'developer', 'github', 'api', 'software', 'tech', 'bug', 'fix'] },
  { id: 'news', name: 'News', color: '#f59e0b', keywords: ['news', 'breaking', 'update', 'report', 'announcement', 'press'] },
  { id: 'random', name: 'Random', color: '#94a3b8', keywords: [] },
];
