import { authenticateRequest } from "../_lib/auth.mjs";
import { readCoreEnvironment } from "../_lib/env.mjs";
import {
  assertOriginAllowed,
  corsHeaders,
  errorResponse,
  HttpError,
  jsonResponse,
  readJson,
  requestId,
} from "../_lib/http.mjs";
import { createCompanionStore } from "../_lib/store.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handleMemoryRequest(request, dependencies = {}) {
  const environment = dependencies.environment ?? readCoreEnvironment(process.env);
  const id = requestId(request);
  let origin;
  try {
    origin = assertOriginAllowed(request, environment.publicOrigins);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin, environment.publicOrigins) });
    }
    if (!["GET", "PATCH", "DELETE"].includes(request.method)) {
      throw new HttpError(405, "method_not_allowed", "GET, PATCH, or DELETE is required");
    }
    const authenticate = dependencies.authenticate ?? authenticateRequest;
    const user = await authenticate(request, environment, dependencies.fetchImpl);
    const store = dependencies.store ?? createCompanionStore(environment, dependencies);

    if (request.method === "GET") {
      const state = await store.getMemories(user.id, request.signal);
      return jsonResponse(state, { requestId: id, origin, allowedOrigins: environment.publicOrigins });
    }
    if (request.method === "DELETE") {
      await store.clearMemories(user.id, request.signal);
      return jsonResponse({ cleared: true }, { requestId: id, origin, allowedOrigins: environment.publicOrigins });
    }

    const payload = await readJson(request, 4_000);
    if (payload?.action === "set_enabled" && typeof payload.enabled === "boolean") {
      await store.setMemoryEnabled(user.id, payload.enabled, request.signal);
      return jsonResponse({ enabled: payload.enabled }, { requestId: id, origin, allowedOrigins: environment.publicOrigins });
    }
    if (payload?.action === "set_status"
      && typeof payload.memoryId === "string"
      && UUID.test(payload.memoryId)
      && ["active", "resolved", "expired"].includes(payload.status)) {
      const changed = await store.setMemoryStatus(user.id, payload.memoryId, payload.status, request.signal);
      if (!changed) throw new HttpError(404, "memory_not_found", "Memory not found");
      return jsonResponse({ changed: true }, { requestId: id, origin, allowedOrigins: environment.publicOrigins });
    }
    throw new HttpError(400, "invalid_memory_change", "Memory change is invalid");
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
  const body = ["GET", "HEAD", "DELETE"].includes(request.method)
    ? undefined
    : (typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? {}));
  if (body && !headers.has("content-type")) headers.set("content-type", "application/json");
  return new Request(`https://${host}${request.url ?? "/api/companion/memory"}`, {
    method: request.method,
    headers,
    body,
  });
}

export default async function handler(request, response) {
  const result = await handleMemoryRequest(webRequestFromNode(request));
  response.statusCode = result.status;
  for (const [name, value] of result.headers) response.setHeader(name, value);
  return response.end(Buffer.from(await result.arrayBuffer()));
}
