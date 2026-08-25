export const NATIVE_AUTH_CALLBACK = "com.yonge6.wendao://auth/callback";

export function readNativeAuthCallback(url: string): { code: string } | null {
  let callback: URL;
  try {
    callback = new URL(url);
  } catch {
    return null;
  }
  if (
    callback.protocol !== "com.yonge6.wendao:"
    || callback.hostname !== "auth"
    || callback.pathname !== "/callback"
  ) return null;
  const providerError = callback.searchParams.get("error_description")
    ?? callback.searchParams.get("error");
  if (providerError) throw new Error(providerError);
  const code = callback.searchParams.get("code");
  if (!code) throw new Error("OAUTH_CODE_MISSING");
  return { code };
}
