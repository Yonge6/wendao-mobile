import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Share } from "@capacitor/share";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { saveStoreKitImage } from "./companion/storekit";

type NativeTheme = "light" | "dark";
export type ShareOutcome = "shared" | "copied" | "downloaded" | "saved" | "cancelled" | "unavailable";

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

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });
  await SplashScreen.hide({ fadeOutDuration: 120 }).catch(() => undefined);
}

export async function syncNativeTheme(theme: NativeTheme): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await StatusBar.setStyle({ style: theme === "dark" ? Style.Dark : Style.Light });
}

export function nativeImpact(style: "light" | "medium" = "light"): void {
  if (!Capacitor.isNativePlatform()) return;
  void Haptics.impact({ style: style === "medium" ? ImpactStyle.Medium : ImpactStyle.Light });
}

export async function shareLink(title: string, url: string): Promise<ShareOutcome> {
  try {
    if (Capacitor.isNativePlatform()) {
      // Keep the URL as the only shared item. On iOS, including descriptive
      // text makes the system Copy action prefer that text over the link.
      await Share.share({ title, url, dialogTitle: title });
      return "shared";
    }
    if (navigator.share) {
      await navigator.share({ title, url });
      return "shared";
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return "copied";
    }
    return "unavailable";
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError" ? "cancelled" : "unavailable";
  }
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

function dataUrlFile(dataUrl: string, filename: string) {
  // Decode synchronously so Web Share stays in the original tap's user activation.
  const bytes = Uint8Array.from(atob(dataUrl.split(",")[1] ?? ""), (character) => character.charCodeAt(0));
  return new File([bytes], filename, { type: "image/png" });
}

export async function shareCardImage(
  dataUrl: string,
  filename: string,
  title: string,
): Promise<ShareOutcome> {
  try {
    if (Capacitor.isNativePlatform()) {
      const base64 = dataUrl.split(",")[1] ?? "";
      await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
      const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
      try {
        // A single image item prevents targets from preferring the accompanying URL.
        await Share.share({ files: [uri], dialogTitle: title });
      } finally {
        await Filesystem.deleteFile({ path: filename, directory: Directory.Cache }).catch(() => undefined);
      }
      return "shared";
    }

    const file = dataUrlFile(dataUrl, filename);
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
      return "shared";
    }

    downloadDataUrl(dataUrl, filename);
    return "downloaded";
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError" ? "cancelled" : "unavailable";
  }
}

export async function saveCardImage(dataUrl: string, filename: string, title: string): Promise<ShareOutcome> {
  try {
    if (Capacitor.getPlatform() === "ios") {
      const base64 = dataUrl.split(",")[1] ?? "";
      const result = await saveStoreKitImage({ data: base64, filename });
      return result.saved ? "saved" : "unavailable";
    }
    if (Capacitor.isNativePlatform()) {
      const base64 = dataUrl.split(",")[1] ?? "";
      await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
      const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
      try {
        await Share.share({ title, files: [uri], dialogTitle: title });
      } finally {
        await Filesystem.deleteFile({ path: filename, directory: Directory.Cache }).catch(() => undefined);
      }
      return "shared";
    }
    downloadDataUrl(dataUrl, filename);
    return "downloaded";
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError" ? "cancelled" : "unavailable";
  }
}

export { CANONICAL_URL };
