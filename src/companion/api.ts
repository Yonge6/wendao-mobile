type CompanionEventMap = {
  meta: Record<string, unknown>;
  delta: { text: string };
  done: Record<string, unknown>;
  error: { code?: string; message?: string };
};

type CompanionEventHandlers = {
  [Kind in keyof CompanionEventMap]?: (data: CompanionEventMap[Kind]) => void;
};

function fetchEventStream(url: string, init: RequestInit) {
  // Capacitor's patched POST fetch buffers URLSession's entire response and
  // drops AbortSignal. SSE must use WebKit fetch; the API explicitly allows
  // capacitor://localhost with the same bearer authentication as the H5.
  const webFetch = typeof window !== "undefined"
    ? (window as Window & { CapacitorWebFetch?: typeof fetch }).CapacitorWebFetch
    : undefined;
  return webFetch
    ? webFetch.call(window, url, init)
    : fetch(url, init);
}

function streamRequestLifetime(parent?: AbortSignal) {
  const controller = new AbortController();
  let rejectStopped!: (error: unknown) => void;
  const stopped = new Promise<never>((_resolve, reject) => { rejectStopped = reject; });
  const stop = (reason: unknown) => {
    controller.abort(reason);
    rejectStopped(reason);
  };
  const cancel = () => stop(parent?.reason ?? new DOMException("Request cancelled", "AbortError"));
  parent?.addEventListener("abort", cancel, { once: true });
  // A single deadline covers connection and every body read. Manual wiring
  // supports older WebKit without AbortSignal.any/timeout and native transports
  // that fail to settle their fetch promise after cancellation.
  const timeout = setTimeout(() => stop(new DOMException("Wendao Companion request timed out", "TimeoutError")), 75_000);
  return {
    signal: controller.signal,
    wait: <T,>(work: Promise<T>) => Promise.race([work, stopped]),
    cleanup: () => {
      clearTimeout(timeout);
      parent?.removeEventListener("abort", cancel);
    },
  };
}

export class CompanionApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 0) {
    super(message);
    this.name = "CompanionApiError";
    this.code = code;
    this.status = status;
  }
}

export async function readCompanionEvents(
  body: ReadableStream<Uint8Array>,
  handlers: CompanionEventHandlers,
  signal?: AbortSignal,
) {
  if (signal?.aborted) throw signal.reason ?? new DOMException("Request cancelled", "AbortError");
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;
  let rejectStopped!: (error: unknown) => void;
  const stopped = new Promise<never>((_resolve, reject) => { rejectStopped = reject; });
  const cancel = () => {
    const reason = signal?.reason ?? new DOMException("Request cancelled", "AbortError");
    void reader.cancel(reason).catch(() => undefined);
    rejectStopped(reason);
  };
  signal?.addEventListener("abort", cancel, { once: true });

  function consume(block: string) {
    const event = block.match(/^event:\s*([^\n]+)/m)?.[1]?.trim() as keyof CompanionEventMap | undefined;
    const data = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");
    if (!event || !data || !handlers[event]) return;
    handlers[event]?.(JSON.parse(data));
  }

  try {
    while (true) {
      const { value, done } = await (signal ? Promise.race([reader.read(), stopped]) : reader.read());
      buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";
      blocks.forEach(consume);
      if (done) { completed = true; break; }
    }
    if (buffer.trim()) consume(buffer);
  } finally {
    signal?.removeEventListener("abort", cancel);
    if (!completed) void reader.cancel().catch(() => undefined);
    try { reader.releaseLock(); } catch { /* Cancellation may still be settling a transport-owned read. */ }
  }
}

export async function streamCompanionAnswer({
  apiUrl,
  accessToken,
  requestId,
  threadId,
  chapterId,
  locale,
  question,
  handlers,
  signal,
  onRequestIdChanged,
  allowReleasedRetry = true,
}: {
  apiUrl: string;
  accessToken: string;
  requestId: string;
  threadId?: string | null;
  chapterId: number;
  locale: "zh" | "en";
  question: string;
  handlers: CompanionEventHandlers;
  signal?: AbortSignal;
  onRequestIdChanged?: (requestId: string) => void;
  allowReleasedRetry?: boolean;
}) {
  if (signal?.aborted) throw signal.reason ?? new DOMException("Request cancelled", "AbortError");
  const lifetime = streamRequestLifetime(signal);
  try {
    let completed = false;
    const request = fetchEventStream(`${apiUrl}/api/companion/respond`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
        "x-request-id": requestId,
      },
      body: JSON.stringify({ requestId, threadId, chapterId, locale, question }),
      signal: lifetime.signal,
    });
    // A late response from a transport that ignored abort must not keep its body
    // open after the caller has left or the deadline has elapsed.
    void request.then((response) => {
      if (lifetime.signal.aborted) void response.body?.cancel().catch(() => undefined);
    }).catch(() => undefined);
    const response = await lifetime.wait(request);
    if (!response.ok) {
      const payload = await lifetime.wait(response.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
      // Rotate only after the server proves the previous reservation was released.
      // Uncertain or completed requests always reuse the original id for replay.
      if (response.status === 409 && payload?.error?.code === "request_released" && allowReleasedRetry) {
        const nextId = crypto.randomUUID();
        onRequestIdChanged?.(nextId);
        return streamCompanionAnswer({ apiUrl, accessToken, requestId: nextId, threadId, chapterId, locale, question, handlers, signal, onRequestIdChanged, allowReleasedRetry: false });
      }
      throw new CompanionApiError(payload?.error?.code || "request_failed", payload?.error?.message || "Wendao Companion is temporarily unavailable", response.status);
    }
    if (!response.body) throw new Error("Wendao Companion is temporarily unavailable");
    await lifetime.wait(readCompanionEvents(response.body, {
      ...handlers,
      error: (payload) => {
        const error = new CompanionApiError(payload.code || "ai_unavailable", payload.message || "AI provider unavailable");
        handlers.error?.(payload);
        throw error;
      },
      done: (payload) => {
        completed = true;
        handlers.done?.(payload);
      },
    }, lifetime.signal));
    if (!completed) throw new Error("Wendao Companion response was interrupted");
  } finally {
    lifetime.cleanup();
  }
}

export type CompanionMemory = {
  id: string;
  kind: "current_situation" | "recurring_theme" | "preference_boundary" | "practice_outcome";
  summary: string;
  status: "active" | "resolved" | "expired";
  confidence: number;
  occurred_at: string | null;
  expires_at: string | null;
  updated_at: string;
};

async function authorizedJson<T>(
  apiUrl: string,
  accessToken: string,
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
  });
  const payload = await response.json().catch(() => null) as T & { error?: { code?: string; message?: string } };
  if (!response.ok) {
    throw new CompanionApiError(
      payload?.error?.code || "request_failed",
      payload?.error?.message || "The requested information is temporarily unavailable",
      response.status,
    );
  }
  return payload;
}

export function loadCompanionMemories(apiUrl: string, accessToken: string) {
  return authorizedJson<{ enabled: boolean; memories: CompanionMemory[] }>(apiUrl, accessToken, "/api/companion/memory", { method: "GET" });
}

export function setCompanionMemoryEnabled(apiUrl: string, accessToken: string, enabled: boolean) {
  return authorizedJson<{ enabled: boolean }>(apiUrl, accessToken, "/api/companion/memory", {
    method: "PATCH",
    body: JSON.stringify({ action: "set_enabled", enabled }),
  });
}

export function setCompanionMemoryStatus(
  apiUrl: string,
  accessToken: string,
  memoryId: string,
  status: CompanionMemory["status"],
) {
  return authorizedJson<{ changed: boolean }>(apiUrl, accessToken, "/api/companion/memory", {
    method: "PATCH",
    body: JSON.stringify({ action: "set_status", memoryId, status }),
  });
}

export function clearCompanionMemories(apiUrl: string, accessToken: string) {
  return authorizedJson<{ cleared: boolean }>(apiUrl, accessToken, "/api/companion/memory", { method: "DELETE" });
}

export type WeeklyReflection = {
  id: string;
  week_start: string;
  locale: "zh" | "en";
  content: string;
  chapter_ids: number[];
  updated_at: string;
};

export async function loadWeeklyReflection(apiUrl: string, accessToken: string) {
  return authorizedJson<{ weekStart: string; reflection: WeeklyReflection | null }>(
    apiUrl,
    accessToken,
    "/api/companion/weekly-reflection",
    { method: "GET" },
  );
}

export async function generateWeeklyReflection({
  apiUrl,
  accessToken,
  locale,
  handlers,
}: {
  apiUrl: string;
  accessToken: string;
  locale: "zh" | "en";
  handlers: CompanionEventHandlers;
}) {
  let completed = false;
  const response = await fetchEventStream(`${apiUrl}/api/companion/weekly-reflection`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ locale }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null;
    throw new CompanionApiError(
      payload?.error?.code || "weekly_request_failed",
      payload?.error?.message || "Weekly reflection is temporarily unavailable",
      response.status,
    );
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = await response.json() as { reflection?: WeeklyReflection };
    if (payload.reflection?.content) handlers.delta?.({ text: payload.reflection.content });
    handlers.done?.({ replayed: true });
    return;
  }
  if (!response.body) throw new CompanionApiError("weekly_stream_missing", "Weekly reflection is temporarily unavailable");
  await readCompanionEvents(response.body, {
    ...handlers,
    done: (payload) => {
      completed = true;
      handlers.done?.(payload);
    },
  });
  if (!completed) {
    throw new CompanionApiError("weekly_stream_interrupted", "Weekly reflection stopped before it was complete");
  }
}

export function createStripeCheckout(
  apiUrl: string,
  accessToken: string,
  plan: "monthly" | "annual",
) {
  return authorizedJson<{ url: string }>(apiUrl, accessToken, "/api/billing/stripe-checkout", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
}

export function createStripePortal(apiUrl: string, accessToken: string) {
  return authorizedJson<{ url: string }>(apiUrl, accessToken, "/api/billing/stripe-portal", {
    method: "POST",
  });
}

export function verifyAppleTransaction(apiUrl: string, accessToken: string, signedTransaction: string) {
  return authorizedJson<{ verified: boolean; processed: boolean; entitlement: string }>(
    apiUrl,
    accessToken,
    "/api/billing/apple-transaction",
    { method: "POST", body: JSON.stringify({ signedTransaction }) },
  );
}

export function reserveApplePurchase(apiUrl: string, accessToken: string, plan: "monthly" | "annual") {
  return authorizedJson<{ ready: boolean }>(apiUrl, accessToken, "/api/billing/apple-purchase-intent", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
}

export function releaseApplePurchase(apiUrl: string, accessToken: string) {
  return authorizedJson<{ released: boolean }>(apiUrl, accessToken, "/api/billing/apple-purchase-intent", {
    method: "DELETE",
  });
}

export function exportCompanionAccount(apiUrl: string, accessToken: string) {
  return authorizedJson<{ exportedAt: string; data: Record<string, unknown> }>(
    apiUrl,
    accessToken,
    "/api/companion/account",
    { method: "GET" },
  );
}

export function deleteCompanionAccount(apiUrl: string, accessToken: string) {
  return authorizedJson<{ deleted: boolean; appleSubscriptionMayContinue: boolean }>(
    apiUrl,
    accessToken,
    "/api/companion/account",
    { method: "DELETE", body: JSON.stringify({ confirmation: "DELETE" }) },
  );
}
