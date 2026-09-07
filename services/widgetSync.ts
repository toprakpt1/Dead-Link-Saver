import * as FileSystem from 'expo-file-system/legacy';
import type { SavedLink } from '@/store/types';

export const WIDGET_FILE = 'widget-data.json';
export const WIDGET_MAX_LINKS = 5;

export interface WidgetLink {
  id: string;
  title: string;
  url: string;
  isDead: boolean;
  isFavorite: boolean;
}

export interface WidgetPayload {
  links: WidgetLink[];
  deadCount: number;
  totalCount: number;
  unreadCount: number;
  updatedAt: number;
}

// Contract shared with the native provider
// (plugins/dead-link-widget): it reads widget-data.json from the app files
// directory and renders up to WIDGET_MAX_LINKS rows, dead links first.
// Row taps deep-link to deadlinksaver://link/<id>; the action bar offers:
// refresh (re-reads the JSON immediately, no 30-min wait), dead list
// (deadlinksaver://forgotten), stats (deadlinksaver://stats); the save button
// opens deadlinksaver:// and the foreground ClipboardPrompt handles the
// clipboard (Android 10+ blocks background clipboard reads, so the widget
// never reads it itself).
// deadCount drives the header badge so the dead total survives the row cut;
// totalCount/unreadCount feed the stats shortcut label.
export function buildWidgetPayload(links: SavedLink[]): WidgetPayload {
  const ordered = [...links].sort((a, b) => Number(b.isDead) - Number(a.isDead));
  return {
    links: ordered.slice(0, WIDGET_MAX_LINKS).map((l) => ({
      id: l.id,
      title: l.metadata.title || l.url,
      url: l.url,
      isDead: l.isDead,
      isFavorite: l.isFavorite,
    })),
    deadCount: links.filter((l) => l.isDead).length,
    totalCount: links.length,
    unreadCount: links.filter((l) => l.status === 'unread').length,
    updatedAt: Date.now(),
  };
}

let lastPayloadJson = '';

export async function syncWidgetData(links: SavedLink[]): Promise<void> {
  try {
    const payload = buildWidgetPayload(links);
    const payloadJson = JSON.stringify({
      links: payload.links,
      deadCount: payload.deadCount,
      totalCount: payload.totalCount,
      unreadCount: payload.unreadCount,
    });
    if (payloadJson === lastPayloadJson) return;
    lastPayloadJson = payloadJson;
    // documentDirectory == app files dir on Android — exactly what the
    // native provider reads (context.filesDir).
    const baseDir = FileSystem.documentDirectory;
    if (!baseDir) return;
    await FileSystem.writeAsStringAsync(`${baseDir}${WIDGET_FILE}`, JSON.stringify(payload), {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (error) {
    console.error('Widget sync failed:', error);
  }
}
