import { CANONICAL_URL, runtimeSurface } from "./native";

/**
 * Comic media stays on the public Wendao site for native builds. The iOS app
 * keeps the chapter text locally, while WKWebView loads and caches only the
 * comics a reader opens.
 */
export function lifeStoryAssetUrl(path: string, surface = runtimeSurface()): string {
  if (surface === "web" || !path) return path;
  return new URL(path, CANONICAL_URL).toString();
}
