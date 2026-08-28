type CompanionEventMap = {
  meta: Record<string, unknown>;
  delta: { text: string };
  done: Record<string, unknown>;
  error: { code?: string; message?: string };
};

type CompanionEventHandlers = {
  [Kind in keyof CompanionEventMap]?: (data: CompanionEventMap[Kind]) => void;
};

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
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

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

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    blocks.forEach(consume);
    if (done) break;
  }
  if (buffer.trim()) consume(buffer);
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
}) {
  let completed = false;
  const response = await fetch(`${apiUrl}/api/companion/respond`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      "x-request-id": requestId,
    },
    body: JSON.stringify({ requestId, threadId, chapterId, locale, question }),
    signal,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error(payload?.error?.message || "Wendao Companion is temporarily unavailable");
  }
  if (!response.body) throw new Error("Wendao Companion is temporarily unavailable");
  await readCompanionEvents(response.body, {
    ...handlers,
    done: (payload) => {
      completed = true;
      handlers.done?.(payload);
    },
  });
  if (!completed) throw new Error("Wendao Companion response was interrupted");
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
  const response = await fetch(`${apiUrl}/api/companion/weekly-reflection`, {
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
