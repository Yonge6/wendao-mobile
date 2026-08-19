import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import type { Provider } from "@supabase/supabase-js";
import { companionClient } from "./client";

const NATIVE_CALLBACK = "com.yonge6.wendao://auth/callback";

export type CompanionAuthProvider = Extract<Provider, "apple" | "google">;

function webCallbackUrl() {
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString();
}

export async function startCompanionSignIn(provider: CompanionAuthProvider) {
  const client = companionClient();
  if (!client) throw new Error("COMPANION_NOT_CONFIGURED");
  const native = Capacitor.isNativePlatform();
  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: native ? NATIVE_CALLBACK : webCallbackUrl(),
      skipBrowserRedirect: native,
    },
  });
  if (error) throw error;
  if (native && data.url) {
    await Browser.open({ url: data.url, presentationStyle: "popover" });
  }
}

export async function signOutCompanion() {
  const client = companionClient();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

async function exchangeNativeCode(event: URLOpenListenerEvent) {
  if (!event.url.startsWith(NATIVE_CALLBACK)) return;
  const client = companionClient();
  if (!client) return;
  const code = new URL(event.url).searchParams.get("code");
  if (!code) throw new Error("OAUTH_CODE_MISSING");
  const { error } = await client.auth.exchangeCodeForSession(code);
  await Browser.close().catch(() => undefined);
  if (error) throw error;
}

export async function installNativeAuthListener(
  onError: (error: unknown) => void,
): Promise<PluginListenerHandle | null> {
  if (!Capacitor.isNativePlatform()) return null;
  return App.addListener("appUrlOpen", (event) => {
    void exchangeNativeCode(event).catch(onError);
  });
}

