import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Prayer } from '../data/prayers';
import { loadCachedValue, saveCachedValue } from './cacheStorage';
import { isSupabaseConfigured, supabase } from './supabaseClient';

const pushTokenCacheKey = 'muslimin:push-token:v1';
const prayerReminderCacheKey = 'muslimin:prayer-reminders:v1';

export type PushRegistrationResult = {
  message: string;
  status: 'denied' | 'granted' | 'unavailable';
  token?: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }) as Notifications.NotificationBehavior,
});

function getProjectId() {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

export async function getCachedPushToken() {
  const cached = await loadCachedValue<string>(pushTokenCacheKey);
  return cached?.value ?? null;
}

async function savePushToken(token: string) {
  await saveCachedValue(pushTokenCacheKey, token);

  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  await supabase.from('device_tokens').upsert(
    {
      enabled: true,
      platform: Platform.OS,
      token,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' },
  );
}

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  if (Platform.OS === 'web') {
    return {
      message: 'Les notifications push seront actives sur la version mobile installée.',
      status: 'unavailable',
    };
  }

  const permissions = await Notifications.getPermissionsAsync();
  let finalStatus = permissions.status;

  if (finalStatus !== 'granted') {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
  }

  if (finalStatus !== 'granted') {
    return {
      message: 'Autorisation refusée. Les notifications restent désactivées.',
      status: 'denied',
    };
  }

  const projectId = getProjectId();

  if (!projectId) {
    return {
      message: 'Notifications autorisées. Il faudra lancer `eas init` pour obtenir le Project ID.',
      status: 'unavailable',
    };
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await savePushToken(token);

  return {
    message: 'Notifications activées pour cet appareil.',
    status: 'granted',
    token,
  };
}

function getNextPrayerDate(time: string, now = new Date()) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(now);
  date.setHours(hours, minutes, 0, 0);

  if (date.getTime() <= now.getTime()) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

async function cancelStoredPrayerReminders() {
  const storedIdentifiers = await loadCachedValue<string[]>(prayerReminderCacheKey);

  if (!storedIdentifiers?.value.length) {
    return;
  }

  await Promise.all(
    storedIdentifiers.value.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
    ),
  );
}

export async function schedulePrayerReminders(
  prayers: Prayer[],
  mosqueName: string,
  minutesBefore = 10,
) {
  if (Platform.OS === 'web') {
    return 'Les rappels de prière seront disponibles sur mobile.';
  }

  const permission = await registerForPushNotifications();

  if (permission.status === 'denied') {
    return permission.message;
  }

  await cancelStoredPrayerReminders();

  const now = new Date();
  const identifiers = await Promise.all(
    prayers.map((prayer) => {
      const prayerDate = getNextPrayerDate(prayer.time, now);
      const reminderDate = new Date(prayerDate.getTime() - minutesBefore * 60 * 1000);
      const triggerDate = reminderDate.getTime() > now.getTime() ? reminderDate : prayerDate;

      return Notifications.scheduleNotificationAsync({
        content: {
          body: `${prayer.name} à ${prayer.time} - ${mosqueName}`,
          sound: false,
          title: `Rappel ${prayer.name}`,
        },
        trigger: new Date(triggerDate) as unknown as Notifications.NotificationTriggerInput,
      });
    }),
  );

  await saveCachedValue(prayerReminderCacheKey, identifiers);

  if (prayers.length === 1) {
    const [prayer] = prayers;
    return `Rappel programmé pour ${prayer.name} à ${prayer.time} - ${mosqueName}.`;
  }

  return `Rappels programmés pour ${mosqueName}.`;
}

export async function clearPrayerReminders() {
  await cancelStoredPrayerReminders();
  await saveCachedValue(prayerReminderCacheKey, []);
}
