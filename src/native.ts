import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Share } from "@capacitor/share";
import { StatusBar, Style } from "@capacitor/status-bar";

type NativeTheme = "light" | "dark";
type ShareOutcome = "shared" | "copied" | "cancelled" | "unavailable";

const CANONICAL_URL = "https://wendao.wonderelian.com/";

export function runtimeSurface(): "web" | "ios" | "android" {
  const platform = Capacitor.getPlatform();
  return platform === "ios" || platform === "android" ? platform : "web";
}

export async function initializeNativeShell(theme: NativeTheme): Promise<void> {
  document.documentElement.dataset.nativeApp = Capacitor.getPlatform();
  if (!Capacitor.isNativePlatform()) return;

  await Promise.allSettled([
    StatusBar.setOverlaysWebView({ overlay: true }),
    syncNativeTheme(theme),
  ]);
}

export async function syncNativeTheme(theme: NativeTheme): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await StatusBar.setStyle({ style: theme === "dark" ? Style.Dark : Style.Light });
}

export function nativeImpact(style: "light" | "medium" = "light"): void {
  if (!Capacitor.isNativePlatform()) return;
  void Haptics.impact({ style: style === "medium" ? ImpactStyle.Medium : ImpactStyle.Light });
}

export async function shareWendao(language: "zh" | "en"): Promise<ShareOutcome> {
  const title = language === "zh" ? "三慢问道" : "Wendao";
  const text = language === "zh"
    ? "一起慢下来，读一章《道德经》。"
    : "Slow down with one chapter of the Daodejing.";

  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title, text, url: CANONICAL_URL, dialogTitle: title });
      return "shared";
    }
    if (navigator.share) {
      await navigator.share({ title, text, url: CANONICAL_URL });
      return "shared";
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(CANONICAL_URL);
      return "copied";
    }
    return "unavailable";
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError" ? "cancelled" : "unavailable";
  }
}
