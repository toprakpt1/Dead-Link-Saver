import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { storage } from '@/utils/storage';
import { checkMultipleLinks, appendCheck } from '@/services/linkChecker';
import { notifyDeadLinks } from '@/services/notifications';
import i18n, { initI18n } from '@/utils/i18n';

export const BG_SCAN_TASK = 'dead-link-weekly-scan';
export const WEEK_SECONDS = 7 * 24 * 60 * 60;

export interface BackgroundScanResult {
  checked: number;
  dead: number;
}

// Core scan: reads straight from storage (no store dependency — the BG task
// may run in a headless context). Marks newly-dead links and notifies.
export async function performBackgroundScan(): Promise<BackgroundScanResult> {
  const links = await storage.loadLinks();
  if (links.length === 0) return { checked: 0, dead: 0 };

  const results = await checkMultipleLinks(links.map((l) => l.url));

  const deadIds: string[] = [];
  const at = Date.now();
  const updated = links.map((link) => {
    const result = results.get(link.url);
    const status = result?.statusCode === undefined ? 'error' : result.isDead ? 'dead' : 'alive';
    const withCheck = appendCheck(link, status, result?.statusCode, at);
    if (result?.isDead && !link.isDead) {
      deadIds.push(link.id);
      return { ...withCheck, isDead: true, archiveUrl: result.archiveUrl };
    }
    return withCheck;
  });

  await storage.saveLinks(updated);

  if (deadIds.length > 0) {
    try {
      await initI18n();
    } catch {
      // fall through with whatever locale state exists
    }
    await notifyDeadLinks(
      i18n.t('notify.deadTitle'),
      i18n.t('notify.deadBody', { count: deadIds.length })
    );
  }

  return { checked: links.length, dead: deadIds.length };
}

TaskManager.defineTask(BG_SCAN_TASK, async () => {
  try {
    await performBackgroundScan();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background scan failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundScan(): Promise<boolean> {
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(BG_SCAN_TASK);
    if (!registered) {
      await BackgroundFetch.registerTaskAsync(BG_SCAN_TASK, {
        minimumInterval: WEEK_SECONDS,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
    return true;
  } catch (error) {
    // Expo Go / simulator: background tasks need a dev build — warn, don't crash
    console.warn('Background scan registration skipped:', error);
    return false;
  }
}

export async function isBackgroundScanRegistered(): Promise<boolean> {
  try {
    return await TaskManager.isTaskRegisteredAsync(BG_SCAN_TASK);
  } catch {
    return false;
  }
}
