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
