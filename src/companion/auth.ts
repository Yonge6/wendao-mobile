import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import type { Provider } from "@supabase/supabase-js";
import { NATIVE_AUTH_CALLBACK, readNativeAuthCallback } from "./auth-callback";
import { companionClient } from "./client";

const handledNativeCallbacks = new Set<string>();

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
      redirectTo: native ? NATIVE_AUTH_CALLBACK : webCallbackUrl(),
      skipBrowserRedirect: native,
      scopes: provider === "apple" ? "name email" : "openid email profile",
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

async function exchangeNativeCode(url: string) {
  const callback = readNativeAuthCallback(url);
  if (!callback || handledNativeCallbacks.has(url)) return;
  handledNativeCallbacks.add(url);
  const client = companionClient();
  if (!client) {
    handledNativeCallbacks.delete(url);
    throw new Error("COMPANION_NOT_CONFIGURED");
  }
  try {
    const { error } = await client.auth.exchangeCodeForSession(callback.code);
    if (error) throw error;
  } catch (error) {
    handledNativeCallbacks.delete(url);
    throw error;
  } finally {
    await Browser.close().catch(() => undefined);
  }
}

export async function installNativeAuthListener(
  onError: (error: unknown) => void,
): Promise<PluginListenerHandle | null> {
  if (!Capacitor.isNativePlatform()) return null;
  const listener = await App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
    void exchangeNativeCode(event.url).catch(onError);
  });
  const launchUrl = await App.getLaunchUrl();
  if (launchUrl?.url) void exchangeNativeCode(launchUrl.url).catch(onError);
  return listener;
}
