/**
 * Local notification helpers for event schedule reminders.
 * Uses @notifee/react-native for scheduling.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_PREFS_KEY = '@arcc_notif_prefs';
const NOTIF_ENABLED_KEY = '@arcc_notif_enabled';
const EVENT_NOTIF_ENABLED_KEY = '@arcc_event_notif_enabled';

let notifee: any = null;
let TriggerType: any = null;

/** Lazy-load notifee to avoid crashes if native module isn't linked yet */
function getNotifee() {
  if (!notifee) {
    try {
      const mod = require('@notifee/react-native');
      notifee = mod.default;
      TriggerType = mod.TriggerType;
    } catch {
      return null;
    }
  }
  return notifee;
}

/** Check if notifications are globally enabled */
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(NOTIF_ENABLED_KEY);
    return val === 'true'; // disabled by default — user must opt-in
  } catch {
    return false;
  }
}

/** Set global notification toggle */
export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(NOTIF_ENABLED_KEY, enabled ? 'true' : 'false');
  if (!enabled) {
    await cancelAllEventNotifications();
  }
}

/** Check if event notifications are enabled */
export async function areEventNotificationsEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(EVENT_NOTIF_ENABLED_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

/** Set event notification toggle */
export async function setEventNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(EVENT_NOTIF_ENABLED_KEY, enabled ? 'true' : 'false');
  if (!enabled) {
    await cancelAllEventNotifications();
  }
}

/** Get set of event names that have notifications enabled */
export async function getNotifiedEvents(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_PREFS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

/** Toggle notification for a specific event by name */
export async function toggleEventNotification(eventName: string): Promise<boolean> {
  const prefs = await getNotifiedEvents();
  const isNowEnabled = !prefs.has(eventName);
  if (isNowEnabled) {
    prefs.add(eventName);
  } else {
    prefs.delete(eventName);
    await cancelNotificationsForEvent(eventName);
  }
  await AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify([...prefs]));
  return isNowEnabled;
}

/** Ensure the notification channel exists (Android) */
async function ensureChannel(): Promise<string> {
  const n = getNotifee();
  if (!n) return '';
  const channelId = await n.createChannel({
    id: 'event_reminders',
    name: 'Event Reminders',
    importance: 4, // HIGH
  });
  return channelId;
}

/** Request notification permissions */
export async function requestPermissions(): Promise<boolean> {
  const n = getNotifee();
  if (!n) return false;
  try {
    const settings = await n.requestPermission();
    return settings.authorizationStatus >= 1;
  } catch {
    return false;
  }
}

type TimeSlot = {start: string; end: string};

/** Parse "HH:MM" UTC to today/tomorrow's Date object */
function utcToNextOccurrence(utcTime: string): Date {
  const [h, m] = utcTime.split(':').map(Number);
  const now = new Date();
  const target = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m || 0),
  );
  // If already passed today, schedule for tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setUTCDate(target.getUTCDate() + 1);
  }
  return target;
}

/** Schedule notifications for a specific event (15 min before each slot) */
export async function scheduleEventNotifications(
  eventName: string,
  slots: TimeSlot[],
  mapName: string,
): Promise<void> {
  const n = getNotifee();
  if (!n) return;

  const globalEnabled = await areNotificationsEnabled();
  if (!globalEnabled) return;

  const channelId = await ensureChannel();
  const LEAD_TIME = 15 * 60 * 1000; // 15 minutes before

  for (const slot of slots) {
    const startTime = utcToNextOccurrence(slot.start);
    const notifTime = new Date(startTime.getTime() - LEAD_TIME);

    // Only schedule if notification time is in the future
    if (notifTime.getTime() > Date.now()) {
      try {
        await n.createTriggerNotification(
          {
            id: `evt_${eventName}_${slot.start}`.replace(/[^a-zA-Z0-9_]/g, '_'),
            title: `${eventName} - Starting Soon`,
            body: `${eventName} on ${mapName} starts in 15 minutes`,
            android: {channelId, smallIcon: 'ic_notification', pressAction: {id: 'default'}},
            ios: {sound: 'default'},
          },
          {
            type: TriggerType.TIMESTAMP,
            timestamp: notifTime.getTime(),
          },
        );
      } catch {
        // Notification scheduling failed silently
      }
    }
  }
}

/** Cancel all notifications for a specific event */
async function cancelNotificationsForEvent(eventName: string): Promise<void> {
  const n = getNotifee();
  if (!n) return;
  try {
    const triggers = await n.getTriggerNotificationIds();
    const prefix = `evt_${eventName}`.replace(/[^a-zA-Z0-9_]/g, '_');
    const toCancel = triggers.filter((id: string) => id.startsWith(prefix));
    for (const id of toCancel) {
      await n.cancelNotification(id);
    }
  } catch {}
}

/** Cancel all event notifications */
export async function cancelAllEventNotifications(): Promise<void> {
  const n = getNotifee();
  if (!n) return;
  try {
    const triggers = await n.getTriggerNotificationIds();
    const toCancel = triggers.filter((id: string) => id.startsWith('evt_'));
    for (const id of toCancel) {
      await n.cancelNotification(id);
    }
  } catch {}
}

/** Reschedule all enabled event notifications (call after app foreground) */
export async function rescheduleAllNotifications(
  events: {name: string; map: string; times: string}[],
): Promise<void> {
  const globalEnabled = await areNotificationsEnabled();
  if (!globalEnabled) return;

  const prefs = await getNotifiedEvents();
  if (prefs.size === 0) return;

  await cancelAllEventNotifications();

  for (const ev of events) {
    if (prefs.has(ev.name)) {
      try {
        const slots: TimeSlot[] = JSON.parse(ev.times);
        await scheduleEventNotifications(ev.name, slots, ev.map);
      } catch {}
    }
  }
}
