import { readCoreEnvironment } from "./_lib/env.mjs";

export const healthPayload = Object.freeze({
  ok: true,
  service: "wendao-companion-api",
  version: 1,
});

export default function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "method_not_allowed" });
  }

  try {
    readCoreEnvironment(process.env);
    response.setHeader("Cache-Control", "no-store");
    return response.status(200).json(healthPayload);
  } catch {
    response.setHeader("Cache-Control", "no-store");
    return response.status(503).json({
      ok: false,
      service: healthPayload.service,
      version: healthPayload.version,
    });
  }
}

