import { createDeepSeekProvider } from "./deepseek.mjs";

export function createModelProvider(environment, dependencies) {
  return createDeepSeekProvider(
    {
      apiKey: environment.deepSeekApiKey,
      baseUrl: environment.deepSeekBaseUrl,
      timeoutMs: environment.requestTimeoutMs,
    },
    dependencies,
  );
}

