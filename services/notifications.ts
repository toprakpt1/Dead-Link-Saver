import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

function isExpoGo(): boolean {
  // Remote push was removed from Expo Go (SDK 53+); even permission/channel
  // calls log errors there. Same mock-mode convention as ads/purchases.
  const ownership = (Constants as { appOwnership?: string }).appOwnership;
  const executionEnv = (Constants as { executionEnvironment?: string }).executionEnvironment;
  return ownership === 'expo' || executionEnv === 'storeClient';
}

let handlerSet = false;

export async function initNotifications(): Promise<boolean> {
  if (isExpoGo()) {
    console.log('[notifications] Expo Go detected - init skipped');
    return false;
  }
  if (!handlerSet) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerSet = true;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    await Notifications.setNotificationChannelAsync('deadlinks', {
      name: 'Dead link alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  if (!Device.isDevice) return true;

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function getNotificationPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch {
    return 'undetermined';
  }
}

export async function scheduleSnoozeNotification(
  linkId: string,
  title: string,
  body: string,
  atMs: number
): Promise<string | null> {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'snooze', linkId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(atMs),
      },
    });
  } catch (error) {
    console.error('Failed to schedule snooze:', error);
    return null;
  }
}

export async function notifyDeadLinks(title: string, body: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: { type: 'dead' } },
      trigger: null,
    });
  } catch (error) {
    console.error('Failed to send dead-link notification:', error);
  }
}

export async function cancelScheduledNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.error('Failed to cancel notification:', error);
  }
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Failed to cancel all notifications:', error);
  }
}

export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    return [];
  }
}

export function addNotificationResponseListener(
  handler: (data: Record<string, unknown> | undefined) => void
): { remove: () => void } {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    handler(data);
  });
  return { remove: () => sub.remove() };
}
