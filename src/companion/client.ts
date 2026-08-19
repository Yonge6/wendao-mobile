import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readCompanionPublicConfig, type CompanionPublicConfig } from "./config";

let cachedConfig: CompanionPublicConfig | null | undefined;
let cachedClient: SupabaseClient | null = null;

export function companionPublicConfig(): CompanionPublicConfig | null {
  if (cachedConfig !== undefined) return cachedConfig;
  try {
    cachedConfig = readCompanionPublicConfig(import.meta.env);
  } catch {
    cachedConfig = null;
  }
  return cachedConfig;
}

export function companionClient(): SupabaseClient | null {
  const config = companionPublicConfig();
  if (!config) return null;
  if (!cachedClient) {
    cachedClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        flowType: "pkce",
      },
    });
  }
  return cachedClient;
}

