import { HttpError } from "../http.mjs";

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const VISIBLE_MODEL = "deepseek-v4-pro";
const BACKGROUND_MODEL = "deepseek-v4-flash";
const PRIMARY_VISIBLE_TIMEOUT_MS = 12_000;
const FALLBACK_VISIBLE_TIMEOUT_MS = 24_000;

export function buildDeepSeekRequest(job, messages) {
  if (job === "visible") {
    return {
      model: VISIBLE_MODEL,
      messages,
      stream: true,
      thinking: { type: "enabled" },
      reasoning_effort: "medium",
      max_tokens: 1800,
    };
  }

  if (job === "visible_fallback") {
    return {
      model: BACKGROUND_MODEL,
      messages,
      stream: true,
      thinking: { type: "disabled" },
      max_tokens: 1600,
    };
  }

  if (job === "background") {
    return {
      model: BACKGROUND_MODEL,
      messages,
      stream: false,
      thinking: { type: "disabled" },
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 700,
    };
  }

  throw new TypeError(`Unknown DeepSeek job: ${job}`);
}

export function createDeepSeekProvider(config, dependencies = {}) {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const timeoutMs = config.timeoutMs ?? 45_000;

  async function call(job, messages, options = {}) {
    const timeoutSignal = AbortSignal.timeout(options.timeoutMs ?? timeoutMs);
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeoutSignal])
      : timeoutSignal;

    let response;
    try {
      response = await fetchImpl(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${config.apiKey}`,
          "content-type": "application/json",
          ...(options.requestId ? { "x-request-id": options.requestId } : {}),
        },
        body: JSON.stringify(buildDeepSeekRequest(job, messages)),
        signal,
      });
    } catch {
      const message = timeoutSignal.aborted
        ? "AI provider timed out"
        : "AI provider unavailable";
      throw new HttpError(503, "ai_unavailable", message);
    }

    if (!response.ok) {
      throw new HttpError(503, "ai_unavailable", "AI provider unavailable");
    }
    return response;
  }

  return Object.freeze({
    async visible(messages, options) {
      try {
        return await call("visible", messages, {
          ...options,
          timeoutMs: Math.min(timeoutMs, PRIMARY_VISIBLE_TIMEOUT_MS),
        });
      } catch (error) {
        if (options?.signal?.aborted) throw error;
        console.warn("DeepSeek visible model unavailable; using flash fallback", {
          requestId: options?.requestId ?? null,
          code: error instanceof HttpError ? error.code : "unknown",
        });
        return call("visible_fallback", messages, {
          ...options,
          timeoutMs: Math.min(timeoutMs, FALLBACK_VISIBLE_TIMEOUT_MS),
        });
      }
    },
    async visibleFallback(messages, options) {
      return call("visible_fallback", messages, {
        ...options,
        timeoutMs: Math.min(timeoutMs, FALLBACK_VISIBLE_TIMEOUT_MS),
      });
    },
    async background(messages, options) {
      const response = await call("background", messages, options);
      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new HttpError(503, "ai_invalid_response", "AI provider unavailable");
      }
      try {
        return {
          data: JSON.parse(content),
          model: payload.model ?? BACKGROUND_MODEL,
          usage: payload.usage ?? null,
        };
      } catch {
        throw new HttpError(503, "ai_invalid_response", "AI provider unavailable");
      }
    },
  });
}
