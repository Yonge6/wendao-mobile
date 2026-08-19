import { authenticateRequest } from "../_lib/auth.mjs";
import { loadChapterContext } from "../_lib/context.mjs";
import { readCoreEnvironment } from "../_lib/env.mjs";
import { entitlementIsCurrent } from "../_lib/entitlements.mjs";
import {
  assertOriginAllowed,
  corsHeaders,
  errorResponse,
  HttpError,
  jsonResponse,
  readJson,
  requestId,
} from "../_lib/http.mjs";
import { createModelProvider } from "../_lib/providers/index.mjs";
import { createCompanionStore } from "../_lib/store.mjs";
import { buildWeeklyReflectionMessages, calendarWeekPeriod } from "../_lib/weekly.mjs";
import { readDeepSeekText } from "./respond.mjs";

const encoder = new TextEncoder();

function event(name, data) {
  return encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
}

function headers(origin, allowedOrigins, id) {
  return {
    ...corsHeaders(origin, allowedOrigins),
    "Content-Type": "text/event-stream; charset=utf-8",
    "X-Accel-Buffering": "no",
    "X-Request-Id": id,
  };
}

export async function handleWeeklyReflectionRequest(request, dependencies = {}) {
  const environment = dependencies.environment ?? readCoreEnvironment(process.env);
  const id = requestId(request);
  let origin;
  try {
    origin = assertOriginAllowed(request, environment.publicOrigins);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin, environment.publicOrigins) });
    }
    if (!["GET", "POST"].includes(request.method)) {
      throw new HttpError(405, "method_not_allowed", "GET or POST is required");
    }
    const authenticate = dependencies.authenticate ?? authenticateRequest;
    const user = await authenticate(request, environment, dependencies.fetchImpl);
    const store = dependencies.store ?? createCompanionStore(environment, dependencies);
    const week = (dependencies.calendarWeek ?? calendarWeekPeriod)(new Date());
    const existing = await store.getWeeklyReflection(user.id, week.start, request.signal);
    if (request.method === "GET") {
      return jsonResponse({ weekStart: week.start, reflection: existing }, {
        requestId: id,
        origin,
        allowedOrigins: environment.publicOrigins,
      });
    }
    const payload = await readJson(request, 2_000);
    const locale = payload?.locale;
    if (!["zh", "en"].includes(locale)) throw new HttpError(400, "invalid_locale", "locale must be zh or en");
    if (existing) {
      return jsonResponse({ weekStart: week.start, reflection: existing, replayed: true }, {
        requestId: id,
        origin,
        allowedOrigins: environment.publicOrigins,
      });
    }
    const entitlement = await store.getEntitlement(user.id, request.signal);
    if (!entitlementIsCurrent(entitlement)) {
      throw new HttpError(402, "subscription_required", "Wendao Companion is required");
    }
    const source = await store.getWeeklySource(user.id, week.since, request.signal);
    const userMessages = source.messages.filter((message) => message.role === "user");
    if (userMessages.length === 0) {
      throw new HttpError(409, "weekly_source_empty", "More conversation is needed for a weekly reflection");
    }
    const chapterIds = [...new Set(source.messages
      .map((message) => Number(message.chapter_id))
      .filter((chapterId) => Number.isInteger(chapterId) && chapterId >= 1 && chapterId <= 81))]
      .slice(-3);
    const loadChapter = dependencies.loadChapter ?? loadChapterContext;
    const chapters = await Promise.all(chapterIds.map((chapterId) => loadChapter(chapterId, locale)));
    const messages = buildWeeklyReflectionMessages({
      locale,
      messages: source.messages,
      memories: source.memories,
      chapters,
    });
    const provider = dependencies.provider ?? createModelProvider(environment, dependencies);
    const providerResponse = await provider.visible(messages, { requestId: id, signal: request.signal });
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(event("meta", { weekStart: week.start, charged: false }));
        void (async () => {
          try {
            const generated = await readDeepSeekText(providerResponse.body, (text) => {
              controller.enqueue(event("delta", { text }));
            });
            const reflectionId = await store.saveWeeklyReflection(
              user.id,
              week.start,
              locale,
              generated.answer,
              chapterIds,
            );
            controller.enqueue(event("done", { weekStart: week.start, reflectionId, charged: false }));
          } catch {
            controller.enqueue(event("error", {
              code: "weekly_reflection_unavailable",
              message: locale === "zh" ? "本周回看暂时无法生成。" : "This week's reflection is temporarily unavailable.",
            }));
          } finally {
            controller.close();
          }
        })();
      },
    });
    return new Response(stream, { status: 200, headers: headers(origin, environment.publicOrigins, id) });
  } catch (error) {
    return errorResponse(error, id, { origin, allowedOrigins: environment.publicOrigins });
  }
}

function webRequestFromNode(request) {
  const requestHeaders = new Headers();
  for (const [name, value] of Object.entries(request.headers ?? {})) {
    if (Array.isArray(value)) requestHeaders.set(name, value.join(", "));
    else if (value !== undefined) requestHeaders.set(name, String(value));
  }
  const host = requestHeaders.get("host") ?? "wendao.wonderelian.com";
  const body = request.method === "POST"
    ? (typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? {}))
    : undefined;
  if (body && !requestHeaders.has("content-type")) requestHeaders.set("content-type", "application/json");
  return new Request(`https://${host}${request.url ?? "/api/companion/weekly-reflection"}`, {
    method: request.method,
    headers: requestHeaders,
    body,
  });
}

export default async function handler(request, response) {
  const result = await handleWeeklyReflectionRequest(webRequestFromNode(request));
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
