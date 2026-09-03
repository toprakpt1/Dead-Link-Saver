import {
  Film, MessageCircle, MessageSquare, Code2, Camera, BookOpen, FileText, Globe,
  Tv, Headphones, Music, Briefcase,
} from 'lucide-react-native';
import { LinkPlatform } from '@/store/types';

export const PLATFORM_ICONS: Record<LinkPlatform, typeof Film> = {
  youtube: Film,
  reddit: MessageCircle,
  twitter: MessageSquare,
  github: Code2,
  instagram: Camera,
  medium: BookOpen,
  article: FileText,
  unknown: Globe,
  twitch: Tv,
  discord: Headphones,
  spotify: Music,
  linkedin: Briefcase,
};

export const PLATFORM_LABELS: Record<LinkPlatform, string> = {
  youtube: 'Video',
  reddit: 'Post',
  twitter: 'Tweet',
  github: 'Repo',
  instagram: 'Post',
  medium: 'Article',
  article: 'Blog',
  unknown: 'Link',
  twitch: 'Stream',
  discord: 'Chat',
  spotify: 'Music',
  linkedin: 'Profile',
};

export const PLATFORM_COLORS: Record<LinkPlatform, string> = {
  youtube: '#ef4444',
  reddit: '#f97316',
  twitter: '#60a5fa',
  github: '#94a3b8',
  instagram: '#ec4899',
  medium: '#a8a29e',
  article: '#10b981',
  unknown: '#94a3b8',
  twitch: '#a855f7',
  discord: '#818cf8',
  spotify: '#4ade80',
  linkedin: '#38bdf8',
};
