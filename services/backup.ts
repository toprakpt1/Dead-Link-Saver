import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform, Alert } from 'react-native';
import { storage } from '@/utils/storage';
import { MONETIZATION } from '@/utils/constants';
import type { SavedLink, Category } from '@/store/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/utils/constants';

export interface BackupPayload {
  version: 1;
  exportedAt: number;
  links: SavedLink[];
  categories: Category[];
}

function backupFileName(): string {
  const d = new Date().toISOString().slice(0, 10);
  return `${MONETIZATION.BACKUP_FILE_PREFIX}-${d}.json`;
}

export async function createBackupFile(): Promise<string> {
  const links = await storage.loadLinks();

  let categories: Category[] = [];
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    categories = raw ? (JSON.parse(raw) as Category[]) : [];
  } catch {
    categories = [];
  }

  const payload: BackupPayload = {
    version: 1,
    exportedAt: Date.now(),
    links,
    categories,
  };

  const json = JSON.stringify(payload, null, 2);

  // FileSystem: use cacheDirectory (works without extra permissions)
  const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!baseDir) throw new Error('No filesystem available');

  const fileUri = `${baseDir}${backupFileName()}`;
  await FileSystem.writeAsStringAsync(fileUri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return fileUri;
}

export async function shareBackup(): Promise<void> {
  const uri = await createBackupFile();

  // Android needs sharing available check
  if (Platform.OS === 'android' && !(await Sharing.isAvailableAsync())) {
    Alert.alert('Paylaşım desteklenmiyor', `Dosya oluşturuldu: ${uri}`);
    return;
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: 'Yedeği paylaş',
    UTI: 'public.json',
  });
}

export async function pickAndRestoreBackup(): Promise<{ imported: number; skipped: number }> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });

  if (res.canceled || !res.assets?.[0]?.uri) {
    return { imported: 0, skipped: 0 };
  }

  const uri = res.assets[0].uri;
  const content = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(content) as unknown;
  } catch {
    throw new Error('Geçersiz yedek dosyası');
  }

  if (!parsed || typeof parsed !== 'object' || !('links' in parsed) || !Array.isArray((parsed as { links: unknown }).links)) {
    throw new Error('Yedek formatı hatalı');
  }

  const payload = parsed as BackupPayload;
  const incomingLinks = payload.links;

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
  if (payload.categories && Array.isArray(payload.categories)) {
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

  return { imported, skipped };
}
