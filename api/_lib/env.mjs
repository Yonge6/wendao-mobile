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

export function readCoreEnvironment(environment = process.env) {
  return Object.freeze({
    supabaseUrl: secureUrl(required(environment, "SUPABASE_URL"), "SUPABASE_URL"),
    supabaseAnonKey: required(environment, "SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: required(environment, "SUPABASE_SERVICE_ROLE_KEY"),
    deepSeekApiKey: required(environment, "DEEPSEEK_API_KEY"),
    deepSeekBaseUrl: secureUrl(
      environment.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com",
      "DEEPSEEK_BASE_URL",
    ),
    publicOrigins: publicOrigins(required(environment, "PUBLIC_ORIGINS")),
    requestTimeoutMs: positiveInteger(
      environment.REQUEST_TIMEOUT_MS,
      45_000,
      "REQUEST_TIMEOUT_MS",
    ),
  });
}

export function readCompanionEnvironment(environment = process.env) {
  return Object.freeze({
    ...readCoreEnvironment(environment),
    monthlyQuestionAllowance: positiveInteger(
      required(environment, "MONTHLY_QUESTION_ALLOWANCE"),
      undefined,
      "MONTHLY_QUESTION_ALLOWANCE",
    ),
  });
}
