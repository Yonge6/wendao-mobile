import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

import { chapters } from "./data/chapters";
import { dailyChapterId, localDateKey } from "./dailyEncounter";

const DAILY_NOTIFICATION_KEY = "wendao-daily-encounter-enabled";
const DAILY_NOTIFICATION_PROMPTED_KEY = "wendao-daily-encounter-prompted";
const DAILY_NOTIFICATION_KIND = "wendao-daily-encounter";
const DAILY_NOTIFICATION_ID_BASE = 810_000;
const DAILY_NOTIFICATION_HOUR = 8;
const SCHEDULE_DAYS = 60;

export type DailyNotificationState = "enabled" | "disabled" | "denied" | "unsupported" | "error";

export function dailyNotificationsEnabled() {
  return typeof window !== "undefined" && window.localStorage.getItem(DAILY_NOTIFICATION_KEY) === "true";
}

function notificationDates(now = new Date()) {
  const first = new Date(now);
  first.setHours(DAILY_NOTIFICATION_HOUR, 0, 0, 0);
  if (first.getTime() <= now.getTime()) first.setDate(first.getDate() + 1);

  return Array.from({ length: SCHEDULE_DAYS }, (_, index) => {
    const date = new Date(first);
    date.setDate(first.getDate() + index);
    return date;
  });
}

async function cancelDailyNotifications() {
  const pending = await LocalNotifications.getPending();
  const notifications = pending.notifications
    .filter((notification) => notification.extra?.kind === DAILY_NOTIFICATION_KIND)
    .map(({ id }) => ({ id }));
  if (notifications.length) await LocalNotifications.cancel({ notifications });
}

async function scheduleDailyNotifications(language: "zh" | "en") {
  await cancelDailyNotifications();
  const notifications = notificationDates().map((date, index) => {
    const chapterId = dailyChapterId(localDateKey(date));
    const chapter = chapters.find((candidate) => candidate.id === chapterId) ?? chapters[0];
    return {
      id: DAILY_NOTIFICATION_ID_BASE + index,
      title: language === "zh" ? "今日偶遇｜三慢问道" : "Today’s encounter · Wendao",
      body: language === "zh"
        ? `第 ${chapter.id} 章 · ${chapter.zh.title}`
        : `Chapter ${chapter.id} · ${chapter.en.title}`,
      schedule: { at: date },
      extra: { kind: DAILY_NOTIFICATION_KIND, chapterId: chapter.id },
      threadIdentifier: DAILY_NOTIFICATION_KIND,
    };
  });
  await LocalNotifications.schedule({ notifications });
}

export async function setDailyNotificationsEnabled(
  enabled: boolean,
  language: "zh" | "en",
): Promise<DailyNotificationState> {
  if (Capacitor.getPlatform() !== "ios") return "unsupported";
  if (!enabled) {
    window.localStorage.setItem(DAILY_NOTIFICATION_KEY, "false");
    await cancelDailyNotifications();
    return "disabled";
  }

  const permissions = await LocalNotifications.checkPermissions();
  const resolved = permissions.display === "prompt" || permissions.display === "prompt-with-rationale"
    ? await LocalNotifications.requestPermissions()
    : permissions;
  if (resolved.display !== "granted") {
    window.localStorage.setItem(DAILY_NOTIFICATION_KEY, "false");
    return "denied";
  }

  await scheduleDailyNotifications(language);
  window.localStorage.setItem(DAILY_NOTIFICATION_KEY, "true");
  return "enabled";
}

export async function refreshDailyNotifications(language: "zh" | "en"): Promise<DailyNotificationState> {
  if (Capacitor.getPlatform() !== "ios") return "unsupported";
  if (!dailyNotificationsEnabled()) return "disabled";
  const permissions = await LocalNotifications.checkPermissions();
  if (permissions.display !== "granted") return "denied";
  await scheduleDailyNotifications(language);
  return "enabled";
}

export async function initializeDailyNotifications(language: "zh" | "en"): Promise<DailyNotificationState> {
  if (Capacitor.getPlatform() !== "ios") return "unsupported";
  const savedPreference = window.localStorage.getItem(DAILY_NOTIFICATION_KEY);
  if (savedPreference !== null) {
    window.localStorage.setItem(DAILY_NOTIFICATION_PROMPTED_KEY, "true");
    if (savedPreference === "true") return refreshDailyNotifications(language);
    const permissions = await LocalNotifications.checkPermissions();
    return permissions.display === "denied" ? "denied" : "disabled";
  }

  const permissions = await LocalNotifications.checkPermissions();
  const resolved = permissions.display === "prompt" || permissions.display === "prompt-with-rationale"
    ? await LocalNotifications.requestPermissions()
    : permissions;
  window.localStorage.setItem(DAILY_NOTIFICATION_PROMPTED_KEY, "true");
  if (resolved.display !== "granted") {
    window.localStorage.setItem(DAILY_NOTIFICATION_KEY, "false");
    return "denied";
  }

  await scheduleDailyNotifications(language);
  window.localStorage.setItem(DAILY_NOTIFICATION_KEY, "true");
  return "enabled";
}

export async function installDailyNotificationListener(
  onOpenChapter: (chapterId: number) => void,
): Promise<PluginListenerHandle | null> {
  if (Capacitor.getPlatform() !== "ios") return null;
  return LocalNotifications.addListener("localNotificationActionPerformed", ({ notification }) => {
    if (notification.extra?.kind !== DAILY_NOTIFICATION_KIND) return;
    const chapterId = Number(notification.extra.chapterId);
    if (Number.isInteger(chapterId) && chapters.some((chapter) => chapter.id === chapterId)) onOpenChapter(chapterId);
  });
}

export const DAILY_NOTIFICATION_TIME_LABEL = "08:00";
