import * as FileSystem from 'expo-file-system/legacy';
import type { SavedLink } from '@/store/types';

export const WIDGET_FILE = 'widget-data.json';
export const WIDGET_MAX_LINKS = 3;

export interface WidgetLink {
  id: string;
  title: string;
  url: string;
  isDead: boolean;
}

export interface WidgetPayload {
  links: WidgetLink[];
  updatedAt: number;
}

// Contract shared with the native provider
// (plugins/dead-link-widget): it reads widget-data.json from the app files
// directory and renders up to WIDGET_MAX_LINKS rows. Row taps deep-link to
// deadlinksaver://link/<id>; the save button opens deadlinksaver:// and the
// foreground ClipboardPrompt handles the clipboard (Android 10+ blocks
// background clipboard reads, so the widget never reads it itself).
export function buildWidgetPayload(links: SavedLink[]): WidgetPayload {
  return {
    links: links.slice(0, WIDGET_MAX_LINKS).map((l) => ({
      id: l.id,
      title: l.metadata.title || l.url,
      url: l.url,
      isDead: l.isDead,
    })),
    updatedAt: Date.now(),
  };
}

let lastLinksJson = '';

export async function syncWidgetData(links: SavedLink[]): Promise<void> {
  try {
    const payload = buildWidgetPayload(links);
    const linksJson = JSON.stringify(payload.links);
    if (linksJson === lastLinksJson) return;
    lastLinksJson = linksJson;
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
