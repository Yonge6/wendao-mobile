type CompanionEventMap = {
  meta: Record<string, unknown>;
  delta: { text: string };
  done: Record<string, unknown>;
  error: { code?: string; message?: string };
};

type CompanionEventHandlers = {
  [Kind in keyof CompanionEventMap]?: (data: CompanionEventMap[Kind]) => void;
};

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
  await readCompanionEvents(response.body, handlers);
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

async function memoryRequest<T>(
  apiUrl: string,
  accessToken: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiUrl}/api/companion/memory`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
  });
  const payload = await response.json().catch(() => null) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(payload?.error?.message || "Memory is temporarily unavailable");
  return payload;
}

export function loadCompanionMemories(apiUrl: string, accessToken: string) {
  return memoryRequest<{ enabled: boolean; memories: CompanionMemory[] }>(apiUrl, accessToken, { method: "GET" });
}

export function setCompanionMemoryEnabled(apiUrl: string, accessToken: string, enabled: boolean) {
  return memoryRequest<{ enabled: boolean }>(apiUrl, accessToken, {
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
  return memoryRequest<{ changed: boolean }>(apiUrl, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ action: "set_status", memoryId, status }),
  });
}

export function clearCompanionMemories(apiUrl: string, accessToken: string) {
  return memoryRequest<{ cleared: boolean }>(apiUrl, accessToken, { method: "DELETE" });
}
