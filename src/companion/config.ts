export type CompanionPublicConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiUrl: string;
};

type PublicEnvironment = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_COMPANION_API_URL?: string;
};

function requiredUrl(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is required`);
  const url = new URL(value);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error(`${name} must use HTTPS`);
  }
  return url.toString().replace(/\/$/, "");
}

function requiredValue(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error(`${name} is required`);
  return value.trim();
}

export function readCompanionPublicConfig(
  environment: PublicEnvironment,
): CompanionPublicConfig {
  return {
    supabaseUrl: requiredUrl(environment.VITE_SUPABASE_URL, "VITE_SUPABASE_URL"),
    supabaseAnonKey: requiredValue(
      environment.VITE_SUPABASE_ANON_KEY,
      "VITE_SUPABASE_ANON_KEY",
    ),
    apiUrl: requiredUrl(
      environment.VITE_COMPANION_API_URL,
      "VITE_COMPANION_API_URL",
    ),
  };
}

