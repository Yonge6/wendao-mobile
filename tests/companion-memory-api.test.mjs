import assert from "node:assert/strict";
import test from "node:test";

import { handleMemoryRequest } from "../api/companion/memory.mjs";

const environment = { publicOrigins: ["https://wendao.wonderelian.com"] };
const authentication = async () => ({ id: "11111111-1111-4111-8111-111111111111" });

function request(method, body) {
  return new Request("https://api.example/api/companion/memory", {
    method,
    headers: {
      authorization: "Bearer session",
      origin: "https://wendao.wonderelian.com",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

test("lists only the signed-in user's memory state", async () => {
  const store = {
    getMemories: async (userId) => ({
      enabled: true,
      memories: [{ id: "m1", summary: `owned by ${userId}` }],
    }),
  };
  const response = await handleMemoryRequest(request("GET"), {
    environment,
    authenticate: authentication,
    store,
  });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /11111111-1111-4111-8111-111111111111/);
});

test("pauses memory and rejects malformed status changes", async () => {
  let enabled;
  const store = { setMemoryEnabled: async (_userId, next) => { enabled = next; } };
  const paused = await handleMemoryRequest(request("PATCH", { action: "set_enabled", enabled: false }), {
    environment,
    authenticate: authentication,
    store,
  });
  assert.equal(paused.status, 200);
  assert.equal(enabled, false);

  const invalid = await handleMemoryRequest(request("PATCH", { action: "set_status", memoryId: "not-a-uuid", status: "resolved" }), {
    environment,
    authenticate: authentication,
    store,
  });
  assert.equal(invalid.status, 400);
});

test("clears memories through the owned server store", async () => {
  let clearedUser;
  const response = await handleMemoryRequest(request("DELETE"), {
    environment,
    authenticate: authentication,
    store: { clearMemories: async (userId) => { clearedUser = userId; } },
  });
  assert.equal(response.status, 200);
  assert.equal(clearedUser, "11111111-1111-4111-8111-111111111111");
});
