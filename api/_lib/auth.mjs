import { HttpError } from "./http.mjs";

export function parseBearerToken(request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization) {
    throw new HttpError(401, "sign_in_required", "Please sign in to continue");
  }

  const match = authorization.match(/^Bearer ([^\s]+)$/i);
  if (!match) {
    throw new HttpError(401, "invalid_authorization", "Invalid authorization header");
  }
  return match[1];
}

export async function authenticateRequest(request, environment, fetchImpl = fetch) {
  const token = parseBearerToken(request);
  const signal = AbortSignal.timeout(environment.requestTimeoutMs ?? 10_000);
  let response;
  try {
    response = await fetchImpl(`${environment.supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: environment.supabaseAnonKey,
        authorization: `Bearer ${token}`,
      },
      signal,
    });
  } catch {
    throw new HttpError(503, "auth_unavailable", "Sign-in verification is unavailable");
  }

  if (!response.ok) {
    throw new HttpError(401, "invalid_session", "Your session has expired");
  }

  const payload = await response.json();
  if (typeof payload.id !== "string" || !payload.id) {
    throw new HttpError(401, "invalid_session", "Your session has expired");
  }

  return { id: payload.id };
}

