import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform, Alert } from 'react-native';
import { storage } from '@/utils/storage';
import { detectPlatform, cleanUrl } from './linkParser';
import { MONETIZATION } from '@/utils/constants';
import type { SavedLink, Category, Collection } from '@/store/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/utils/constants';

export interface BackupPayload {
  version: 1;
  exportedAt: number;
  links: SavedLink[];
  categories: Category[];
  collections?: Collection[];
}

function backupFileName(): string {
  const d = new Date().toISOString().slice(0, 10);
  return `${MONETIZATION.BACKUP_FILE_PREFIX}-${d}.json`;
}

export type ExportFormat = 'json' | 'markdown' | 'csv' | 'html';

export async function createBackupFile(): Promise<string> {
  const links = await storage.loadLinks();
  const categories = await readJsonArray<Category>(STORAGE_KEYS.CATEGORIES);
  const collections = await readJsonArray<Collection>(STORAGE_KEYS.COLLECTIONS);

  const payload: BackupPayload = {
    version: 1,
    exportedAt: Date.now(),
    links,
    categories,
    collections,
  };

  return writeExportFile(backupFileName(), JSON.stringify(payload, null, 2));
}

async function readJsonArray<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

async function writeExportFile(fileName: string, content: string): Promise<string> {
  // FileSystem: use cacheDirectory (works without extra permissions)
  const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!baseDir) throw new Error('No filesystem available');

  const fileUri = `${baseDir}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return fileUri;
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function buildMarkdownExport(links: SavedLink[], categories: Category[]): string {
  const names = new Map(categories.map((c) => [c.id, c.name]));
  const groups = new Map<string, SavedLink[]>();
  for (const link of links) {
    const key = link.category || 'random';
    const group = groups.get(key);
    if (group) group.push(link);
    else groups.set(key, [link]);
  }
  const lines = ['# Dead Link Saver Export', '', `Exported ${new Date().toISOString().slice(0, 10)} — ${links.length} links`, ''];
  for (const [catId, group] of groups) {
    lines.push(`## ${names.get(catId) ?? catId} (${group.length})`, '');
    for (const link of group) {
      const title = link.metadata.title || link.url;
      const flags = [
        link.isDead ? 'dead' : null,
        link.archiveUrl ? `archive: ${link.archiveUrl}` : null,
        link.isFavorite ? 'favorite' : null,
      ].filter(Boolean).join(', ');
      lines.push(`- [${title}](${link.url})${flags ? ` (${flags})` : ''}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function buildCsvExport(links: SavedLink[]): string {
  const header = ['title', 'url', 'platform', 'category', 'status', 'isDead', 'archiveUrl', 'isFavorite', 'createdAt', 'openCount'];
  const rows = links.map((link) =>
    [
      link.metadata.title || '',
      link.url,
      link.platform,
      link.category,
      link.status,
      String(link.isDead),
      link.archiveUrl || '',
      String(link.isFavorite),
      String(link.createdAt),
      String(link.openCount),
    ].map(csvCell).join(',')
  );
  return [header.join(','), ...rows].join('\n');
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function buildHtmlExport(links: SavedLink[], categories: Category[]): string {
  const names = new Map(categories.map((c) => [c.id, c.name]));
  const cards = links.map((link) => {
    const title = escapeHtml(link.metadata.title || link.url);
    const badge = link.isDead
      ? '<span class="badge dead">dead</span>'
      : '<span class="badge alive">alive</span>';
    const archive = link.archiveUrl
      ? `<div><a href="${escapeHtml(link.archiveUrl)}">archive copy</a></div>`
      : '';
    return `<article class="card"><div class="title"><a href="${escapeHtml(link.url)}">${title}</a> ${badge}</div><div class="meta">${escapeHtml(names.get(link.category) ?? link.category)} · ${escapeHtml(link.platform)} · ${escapeHtml(link.status)}</div>${archive}</article>`;
  }).join('\n');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Dead Link Saver Export</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:24px;background:#fafaf9;color:#1c1917}.card{border:1px solid #e7e5e4;border-radius:12px;padding:16px;margin-bottom:12px;background:#fff}.title{font-size:17px;font-weight:700}.title a{color:inherit}.meta{font-size:12px;color:#78716c;margin-top:4px}.badge{font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px}.dead{background:#fee2e2;color:#b91c1c}.alive{background:#dcfce7;color:#15803d}</style></head><body><h1>Dead Link Saver Export</h1><p>${links.length} links</p>${cards}</body></html>`;
}

const EXPORT_META: Record<Exclude<ExportFormat, 'json'>, { ext: string; mime: string }> = {
  markdown: { ext: 'md', mime: 'text/markdown' },
  csv: { ext: 'csv', mime: 'text/csv' },
  html: { ext: 'html', mime: 'text/html' },
};

export async function createExportFile(format: ExportFormat): Promise<string> {
  if (format === 'json') return createBackupFile();
  const links = await storage.loadLinks();
  const categories = await readJsonArray<Category>(STORAGE_KEYS.CATEGORIES);
  const meta = EXPORT_META[format];
  const body =
    format === 'markdown' ? buildMarkdownExport(links, categories)
    : format === 'csv' ? buildCsvExport(links)
    : buildHtmlExport(links, categories);
  const d = new Date().toISOString().slice(0, 10);
  return writeExportFile(`${MONETIZATION.BACKUP_FILE_PREFIX}-${d}.${meta.ext}`, body);
}

export interface ShareStrings {
  dialogTitle: string;
  unavailableTitle: string;
  unavailableMessage: (filePath: string) => string;
}

export async function shareExport(format: ExportFormat, strings: ShareStrings): Promise<void> {
  const uri = await createExportFile(format);

  // Android needs sharing available check
  if (Platform.OS === 'android' && !(await Sharing.isAvailableAsync())) {
    Alert.alert(strings.unavailableTitle, strings.unavailableMessage(uri));
    return;
  }

  const mime = format === 'json' ? 'application/json' : EXPORT_META[format].mime;
  await Sharing.shareAsync(uri, { mimeType: mime, dialogTitle: strings.dialogTitle });
}

export async function shareBackup(strings: ShareStrings): Promise<void> {
  const uri = await createBackupFile();

  // Android needs sharing available check
  if (Platform.OS === 'android' && !(await Sharing.isAvailableAsync())) {
    Alert.alert(strings.unavailableTitle, strings.unavailableMessage(uri));
    return;
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: strings.dialogTitle,
    UTI: 'public.json',
  });
}

export interface ParsedBookmark {
  url: string;
  title?: string;
  addedAt?: number;
}

function decodeBookmarkEntities(input: string): string {
  return input
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_m, code: string) => {
      const cp = Number(code);
      try {
        return String.fromCodePoint(cp);
      } catch {
        return '';
      }
    });
}

/**
 * Netscape bookmark format (<A HREF="..." ADD_DATE="...">title</A>) as
 * exported by Pocket, Raindrop, and every browser. Lenient by design:
 * skips javascript:/place: entries, keeps first-seen order, dedupes.
 */
export function parseBookmarkHtml(html: string): ParsedBookmark[] {
  const seen = new Set<string>();
  const out: ParsedBookmark[] = [];
  const anchorRe = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a\s*>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorRe.exec(html)) !== null) {
    const rawUrl = (match[1] ?? match[2] ?? match[3] ?? '').trim();
    if (!/^https?:\/\//i.test(rawUrl) || seen.has(rawUrl)) continue;
    seen.add(rawUrl);
    const addDate = /add_date\s*=\s*"?(\d+)"?/i.exec(match[0]);
    const title = decodeBookmarkEntities(match[4].replace(/<[^>]*>/g, '').trim()).slice(0, 300);
    out.push({
      url: rawUrl,
      title: title || undefined,
      addedAt: addDate ? Number(addDate[1]) * 1000 : undefined,
    });
  }
  return out;
}

export function bookmarkToSavedLink(bookmark: ParsedBookmark, at: number = Date.now()): SavedLink {
  const url = cleanUrl(bookmark.url);
  const title = bookmark.title || url;
  return {
    id: `${bookmark.addedAt || at}-${Math.random().toString(36).slice(2, 8)}`,
    url,
    platform: detectPlatform(url),
    category: 'random',
    status: 'unread',
    metadata: { title },
    isDead: false,
    isFavorite: false,
    createdAt: bookmark.addedAt || at,
    openCount: 0,
  };
}

export async function pickAndRestoreBackup(): Promise<{ imported: number; skipped: number }> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/html', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });

  if (res.canceled || !res.assets?.[0]?.uri) {
    return { imported: 0, skipped: 0 };
  }

  const uri = res.assets[0].uri;
  const content = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Primary: our own JSON backup. Fallback: Netscape bookmark HTML
  // (Pocket / browser exports) — the migration wave this exists for.
  let incomingLinks: SavedLink[];
  let payload: BackupPayload | null = null;
  try {
    const parsed: unknown = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object' || !('links' in parsed) || !Array.isArray(parsed.links)) {
      throw new Error('INVALID_BACKUP_SHAPE');
    }
    payload = parsed as BackupPayload;
    incomingLinks = payload.links;
  } catch (jsonError) {
    if (/<a\b[^>]*\bhref\s*=/i.test(content)) {
      const now = Date.now();
      incomingLinks = parseBookmarkHtml(content).map((b) => bookmarkToSavedLink(b, now));
      if (incomingLinks.length === 0) throw new Error('INVALID_BACKUP_FILE');
    } else if (jsonError instanceof Error && jsonError.message === 'INVALID_BACKUP_SHAPE') {
      throw jsonError;
    } else {
      throw new Error('INVALID_BACKUP_FILE');
    }
  }

  const existing = await storage.loadLinks();
  const existingUrls = new Set(existing.map((l) => l.url));

  let imported = 0;
  let skipped = 0;
  const merged = [...existing];

  for (const link of incomingLinks) {
    if (!link || typeof link !== 'object' || !('url' in link)) {
      skipped += 1;
      continue;
    }
    const url = (link as { url: unknown }).url;
    if (typeof url !== 'string' || existingUrls.has(url)) {
      skipped += 1;
      continue;
    }
    // Ensure id uniqueness
    const safeLink = link as SavedLink;
    if (existing.some((e) => e.id === safeLink.id)) {
      safeLink.id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
    merged.push(safeLink);
    existingUrls.add(url);
    imported += 1;
  }

  if (imported > 0) {
    await storage.saveLinks(merged);
  }

  // Categories: merge if present
  if (payload?.categories && Array.isArray(payload.categories)) {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const current: Category[] = raw ? (JSON.parse(raw) as Category[]) : [];
      const currentIds = new Set(current.map((c) => c.id));
      const toAdd = payload.categories.filter((c) => !currentIds.has(c.id));
      if (toAdd.length > 0) {
        const next = [...current, ...toAdd];
        await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(next));
      }
    } catch {
      // ignore category merge failure
    }
  }

  // Collections: merge if present (same tolerant pattern as categories)
  if (payload?.collections && Array.isArray(payload.collections)) {
    try {
      const current = await readJsonArray<Collection>(STORAGE_KEYS.COLLECTIONS);
      const currentIds = new Set(current.map((c) => c.id));
      const toAdd = payload.collections.filter(
        (c) => c && typeof c.id === 'string' && typeof c.name === 'string' && !currentIds.has(c.id)
      );
      if (toAdd.length > 0) {
        await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify([...current, ...toAdd]));
      }
    } catch {
      // ignore collection merge failure
    }
  }

  return { imported, skipped };
}
