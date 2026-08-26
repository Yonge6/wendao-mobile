const requiredUrls = ["VITE_SUPABASE_URL", "VITE_COMPANION_API_URL"];
const requiredValues = ["VITE_SUPABASE_ANON_KEY"];

for (const name of requiredUrls) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for an iOS release bundle.`);
  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error(`${name} must use HTTPS for an iOS release bundle.`);
  }
}

for (const name of requiredValues) {
  if (!process.env[name]?.trim()) {
    throw new Error(`${name} is required for an iOS release bundle.`);
  }
}

console.log("Companion client environment is configured for iOS.");
