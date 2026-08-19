import { authenticateRequest } from "../_lib/auth.mjs";
import { buildCompanionMessages, loadChapterContext } from "../_lib/context.mjs";
import { readCompanionEnvironment } from "../_lib/env.mjs";
import {
  assertOriginAllowed,
  corsHeaders,
  errorResponse,
  HttpError,
  readJson,
  requestId as resolveRequestId,
} from "../_lib/http.mjs";
import { createModelProvider } from "../_lib/providers/index.mjs";
import {
  buildMemoryExtractionMessages,
  normalizeExtractedMemories,
} from "../_lib/memory.mjs";
import {
  classifySafetyRisk,
  immediateSafetyResponse,
  validateCompanionQuestion,
} from "../_lib/safety.mjs";
import { createCompanionStore } from "../_lib/store.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const encoder = new TextEncoder();

function sseEvent(event, data) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function streamHeaders(origin, allowedOrigins, id) {
  return {
    ...corsHeaders(origin, allowedOrigins),
    "Content-Type": "text/event-stream; charset=utf-8",
    "X-Accel-Buffering": "no",
    "X-Request-Id": id,
  };
}

function assertUuid(value, field, optional = false) {
  if (optional && (value === undefined || value === null || value === "")) return null;
  if (typeof value !== "string" || !UUID.test(value)) {
    throw new HttpError(400, `invalid_${field}`, `${field} must be a UUID`);
  }
  return value;
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new HttpError(400, "invalid_request", "Request body must be an object");
  }
  const locale = payload.locale;
  if (!["zh", "en"].includes(locale)) {
    throw new HttpError(400, "invalid_locale", "locale must be zh or en");
  }
  const chapterId = Number(payload.chapterId);
  if (!Number.isInteger(chapterId) || chapterId < 1 || chapterId > 81) {
    throw new HttpError(400, "invalid_chapter", "chapterId must be between 1 and 81");
  }
  return {
    requestId: assertUuid(payload.requestId, "request_id"),
    threadId: assertUuid(payload.threadId, "thread_id", true),
    question: validateCompanionQuestion(payload.question),
    locale,
    chapterId,
  };
}

function fixedAnswerStream(answer, metadata, headers) {
  return new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(sseEvent("meta", metadata));
      controller.enqueue(sseEvent("delta", { text: answer }));
      controller.enqueue(sseEvent("done", metadata));
      controller.close();
    },
  }), { status: 200, headers });
}

export async function readDeepSeekText(body, onDelta) {
  if (!body) throw new HttpError(503, "ai_invalid_response", "AI provider unavailable");
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  let model = "deepseek-v4-pro";

  async function consume(block) {
    const data = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");
    if (!data || data === "[DONE]") return;
    let payload;
    try {
      payload = JSON.parse(data);
    } catch {
      throw new HttpError(503, "ai_invalid_response", "AI provider unavailable");
    }
    if (typeof payload.model === "string" && payload.model) model = payload.model.slice(0, 80);
    const text = payload?.choices?.[0]?.delta?.content;
    if (typeof text !== "string" || !text) return;
    if (answer.length + text.length > 12_000) {
      await reader.cancel();
      throw new HttpError(503, "ai_invalid_response", "AI provider response was too long");
    }
    answer += text;
    onDelta(text);
  }

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) await consume(block);
    if (done) break;
  }
  if (buffer.trim()) await consume(buffer);
  if (!answer.trim()) throw new HttpError(503, "ai_invalid_response", "AI provider unavailable");
  return { answer, model };
}

export async function handleCompanionRequest(request, dependencies = {}) {
  const environment = dependencies.environment ?? readCompanionEnvironment(process.env);
  const id = resolveRequestId(request);
  let origin;
  try {
    origin = assertOriginAllowed(request, environment.publicOrigins);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin, environment.publicOrigins) });
    }
    if (request.method !== "POST") {
      throw new HttpError(405, "method_not_allowed", "POST is required");
    }

    const authenticate = dependencies.authenticate ?? authenticateRequest;
    const user = await authenticate(request, environment, dependencies.fetchImpl);
    const payload = validatePayload(await readJson(request));
    const risk = classifySafetyRisk(payload.question);
    const headers = streamHeaders(origin, environment.publicOrigins, id);

    if (risk === "immediate") {
      return fixedAnswerStream(immediateSafetyResponse(payload.locale), {
        requestId: payload.requestId,
        safety: "immediate",
        charged: false,
      }, headers);
    }

    const store = dependencies.store ?? createCompanionStore(environment, dependencies);
    const reservation = await store.reserveQuestion(user.id, payload.requestId, new Date(), request.signal);
    if (reservation.state === "succeeded") {
      const completed = await store.getCompletedExchange(user.id, payload.requestId, request.signal);
      if (!completed) throw new HttpError(409, "completed_answer_unavailable", "Saved answer is unavailable");
      return fixedAnswerStream(completed.answer, {
        requestId: payload.requestId,
        threadId: completed.threadId,
        answerMessageId: completed.answerMessageId,
        remainingQuestions: reservation.remainingQuestions,
        replayed: true,
      }, headers);
    }
    if (reservation.state !== "reserved") {
      throw new HttpError(409, "request_in_progress", "This question is already being answered");
    }

    const loadChapter = dependencies.loadChapter ?? loadChapterContext;
    const [chapter, context, conversation] = await Promise.all([
      loadChapter(payload.chapterId, payload.locale),
      store.getContext(user.id, request.signal),
      store.getRecentMessages(user.id, payload.threadId, request.signal),
    ]);
    const messages = buildCompanionMessages({
      question: payload.question,
      locale: payload.locale,
      chapter,
      memories: context.memories,
      lifeManual: context.lifeManual,
      conversation,
      highStakes: risk === "high_stakes",
    });
    const provider = dependencies.provider ?? createModelProvider(environment, dependencies);
    let providerResponse;
    try {
      providerResponse = await provider.visible(messages, {
        requestId: payload.requestId,
        signal: request.signal,
      });
    } catch (error) {
      await store.releaseQuestion(user.id, payload.requestId).catch(() => undefined);
      throw error;
    }

    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(sseEvent("meta", {
          requestId: payload.requestId,
          remainingQuestions: reservation.remainingQuestions,
        }));
        void (async () => {
          try {
            const generated = await readDeepSeekText(providerResponse.body, (text) => {
              controller.enqueue(sseEvent("delta", { text }));
            });
            const saved = await store.finishExchange({
              userId: user.id,
              requestId: payload.requestId,
              threadId: payload.threadId,
              locale: payload.locale,
              chapterId: payload.chapterId,
              question: payload.question,
              answer: generated.answer,
              provider: "deepseek",
              model: generated.model,
            });
            if (context.memoryEnabled) {
              try {
                const extraction = await provider.background(
                  buildMemoryExtractionMessages({
                    question: payload.question,
                    answer: generated.answer,
                    locale: payload.locale,
                  }),
                  { requestId: payload.requestId },
                );
                const memories = normalizeExtractedMemories(extraction.data);
                if (memories.length) {
                  await store.applyMemoryCandidates(user.id, saved.threadId, memories);
                }
              } catch {
                // Memory extraction is best effort and must never invalidate a saved answer.
              }
            }
            controller.enqueue(sseEvent("done", {
              requestId: payload.requestId,
              ...saved,
              remainingQuestions: reservation.remainingQuestions,
            }));
          } catch (error) {
            await store.releaseQuestion(user.id, payload.requestId).catch(() => undefined);
            const publicError = error instanceof HttpError
              ? error
              : new HttpError(503, "ai_unavailable", "AI provider unavailable");
            controller.enqueue(sseEvent("error", {
              code: publicError.code,
              message: publicError.message,
            }));
          } finally {
            controller.close();
          }
        })();
      },
    });
    return new Response(body, { status: 200, headers });
  } catch (error) {
    return errorResponse(error, id, { origin, allowedOrigins: environment.publicOrigins });
  }
}

function webRequestFromNode(request) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers ?? {})) {
    if (Array.isArray(value)) headers.set(name, value.join(", "));
    else if (value !== undefined) headers.set(name, String(value));
  }
  const host = headers.get("host") ?? "wendao.wonderelian.com";
  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : (typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? {}));
  if (body && !headers.has("content-type")) headers.set("content-type", "application/json");
  return new Request(`https://${host}${request.url ?? "/api/companion/respond"}`, {
    method: request.method,
    headers,
    body,
  });
}

export default async function handler(request, response) {
  const result = await handleCompanionRequest(webRequestFromNode(request));
  response.statusCode = result.status;
  for (const [name, value] of result.headers) response.setHeader(name, value);
  if (!result.body) return response.end();
  const reader = result.body.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    response.write(Buffer.from(value));
  }
  return response.end();
}
