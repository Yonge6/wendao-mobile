import { APPLE_ROOT_CERTIFICATES } from "./apple-root-certificates.mjs";

function required(environment, name) {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function secureUrl(value, name) {
  const url = new URL(value);
  const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !isLocal) {
    throw new Error(`${name} must use HTTPS`);
  }
  return url.toString().replace(/\/$/, "");
}

function publicOrigins(value) {
  if (value.trim() === "*") {
    throw new Error("PUBLIC_ORIGINS cannot use a wildcard");
  }

  const origins = value.split(",").map((entry) => entry.trim()).filter(Boolean);
  if (origins.length === 0) throw new Error("PUBLIC_ORIGINS must not be empty");
  return origins.map((origin) => {
    if (origin === "capacitor://localhost") return origin;
    const url = new URL(origin);
    if (url.origin !== origin.replace(/\/$/, "")) {
      throw new Error("PUBLIC_ORIGINS entries must be origins without paths");
    }
    return secureUrl(url.origin, "PUBLIC_ORIGINS");
  });
}

function positiveInteger(value, fallback, name) {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

export function readServiceEnvironment(environment = process.env) {
  return Object.freeze({
    supabaseUrl: secureUrl(required(environment, "SUPABASE_URL"), "SUPABASE_URL"),
    supabaseAnonKey: required(environment, "SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: required(environment, "SUPABASE_SERVICE_ROLE_KEY"),
    publicOrigins: publicOrigins(required(environment, "PUBLIC_ORIGINS")),
    requestTimeoutMs: positiveInteger(
      environment.REQUEST_TIMEOUT_MS,
      45_000,
      "REQUEST_TIMEOUT_MS",
    ),
  });
}

export function readCoreEnvironment(environment = process.env) {
  return Object.freeze({
    ...readServiceEnvironment(environment),
    deepSeekApiKey: required(environment, "DEEPSEEK_API_KEY"),
    deepSeekBaseUrl: secureUrl(
      environment.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com",
      "DEEPSEEK_BASE_URL",
    ),
  });
}

export function readCompanionEnvironment(environment = process.env) {
  return readCoreEnvironment(environment);
}

function stripeSecret(environment) {
  const value = required(environment, "STRIPE_SECRET_KEY");
  if (!value.startsWith("sk_")) throw new Error("STRIPE_SECRET_KEY is invalid");
  return value;
}

export function readStripeCheckoutEnvironment(environment = process.env) {
  return Object.freeze({
    ...readServiceEnvironment(environment),
    stripeSecretKey: stripeSecret(environment),
    stripeMonthlyPriceId: required(environment, "STRIPE_PRICE_MONTHLY"),
    stripeAnnualPriceId: required(environment, "STRIPE_PRICE_ANNUAL"),
  });
}

export function readStripeWebhookEnvironment(environment = process.env) {
  const webhookSecret = required(environment, "STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret.startsWith("whsec_")) throw new Error("STRIPE_WEBHOOK_SECRET is invalid");
  return Object.freeze({
    ...readServiceEnvironment(environment),
    stripeSecretKey: stripeSecret(environment),
    stripeWebhookSecret: webhookSecret,
  });
}

export function readAppleEnvironment(environment = process.env) {
  const appAppleId = Number(required(environment, "APPLE_APP_ID"));
  if (!Number.isSafeInteger(appAppleId) || appAppleId < 1) {
    throw new Error("APPLE_APP_ID must be a positive integer");
  }
  return Object.freeze({
    ...readServiceEnvironment(environment),
    appleBundleId: required(environment, "APPLE_BUNDLE_ID"),
    appleAppId: appAppleId,
    appleRootCertificates: APPLE_ROOT_CERTIFICATES,
  });
}

export function readAccountEnvironment(environment = process.env) {
  const stripeSecretKey = environment.STRIPE_SECRET_KEY?.trim() || null;
  if (stripeSecretKey && !stripeSecretKey.startsWith("sk_")) {
    throw new Error("STRIPE_SECRET_KEY is invalid");
  }
  return Object.freeze({
    ...readServiceEnvironment(environment),
    stripeSecretKey,
  });
}
