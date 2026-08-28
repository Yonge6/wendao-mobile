import { Capacitor, registerPlugin } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Share } from "@capacitor/share";
import { StatusBar, Style } from "@capacitor/status-bar";

type NativeTheme = "light" | "dark";
export type ShareOutcome = "shared" | "copied" | "downloaded" | "saved" | "cancelled" | "unavailable";

type NativeImagePlugin = {
  saveImageToPhotos(input: { data: string; filename: string }): Promise<{ saved: boolean }>;
};

const nativeImage = registerPlugin<NativeImagePlugin>("WendaoStoreKit");

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

export async function shareLink(title: string, text: string, url: string): Promise<ShareOutcome> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title, text, url, dialogTitle: title });
      return "shared";
    }
    if (navigator.share) {
      await navigator.share({ title, text, url });
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

async function dataUrlFile(dataUrl: string, filename: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: "image/png" });
}

export async function shareCardImage(
  dataUrl: string,
  filename: string,
  title: string,
  text: string,
  url: string,
): Promise<ShareOutcome> {
  try {
    if (Capacitor.isNativePlatform()) {
      const base64 = dataUrl.split(",")[1] ?? "";
      await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
      const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
      try {
        await Share.share({ title, text, url, files: [uri], dialogTitle: title });
      } finally {
        await Filesystem.deleteFile({ path: filename, directory: Directory.Cache }).catch(() => undefined);
      }
      return "shared";
    }

    const file = await dataUrlFile(dataUrl, filename);
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, text, url, files: [file] });
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
      const result = await nativeImage.saveImageToPhotos({ data: base64, filename });
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
