import { randomUUID } from "node:crypto";

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export function corsHeaders(origin, allowedOrigins = []) {
  const headers = {
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Request-Id",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export function assertOriginAllowed(request, allowedOrigins) {
  const origin = request.headers.get("origin");
  if (origin && !allowedOrigins.includes(origin)) {
    throw new HttpError(403, "origin_not_allowed", "This origin is not allowed");
  }
  return origin;
}

export function requestId(request) {
  const candidate = request.headers.get("x-request-id");
  return candidate && /^[a-zA-Z0-9_-]{8,80}$/.test(candidate)
    ? candidate
    : randomUUID();
}

export function jsonResponse(body, options = {}) {
  const { status = 200, requestId: id, origin, allowedOrigins } = options;
  const payload = id ? { ...body, requestId: id } : body;
  return Response.json(payload, {
    status,
    headers: {
      ...corsHeaders(origin, allowedOrigins),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export function errorResponse(error, id, options = {}) {
  if (error instanceof HttpError) {
    return jsonResponse(
      { error: { code: error.code, message: error.message } },
      { ...options, status: error.status, requestId: id },
    );
  }

  return jsonResponse(
    { error: { code: "internal_error", message: "Service temporarily unavailable" } },
    { ...options, status: 500, requestId: id },
  );
}

export async function readJson(request, maxBytes = 24_000) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new HttpError(415, "unsupported_media_type", "JSON is required");
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new HttpError(413, "request_too_large", "Request is too large");
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new HttpError(413, "request_too_large", "Request is too large");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "invalid_json", "Request body is not valid JSON");
  }
}

