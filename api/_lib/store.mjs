import { HttpError } from "./http.mjs";

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function calendarMonthPeriod(now = new Date()) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError("now must be a valid Date");
  }
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start: isoDate(start), end: isoDate(end) };
}

function publicStoreError(response, payload) {
  const message = String(payload?.message ?? "");
  if (message.includes("subscription_required")) {
    return new HttpError(402, "subscription_required", "Wendao Companion is required");
  }
  if (message.includes("quota_exhausted")) {
    return new HttpError(429, "quota_exhausted", "Monthly question allowance reached");
  }
  if (message.includes("thread_not_found")) {
    return new HttpError(404, "thread_not_found", "Conversation not found");
  }
  if (message.includes("reservation_not_found")) {
    return new HttpError(409, "reservation_not_found", "Question reservation not found");
  }
  return new HttpError(
    response.status === 429 ? 429 : 503,
    "storage_unavailable",
    "Companion storage is unavailable",
  );
}

export function createCompanionStore(environment, dependencies = {}) {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const restUrl = `${environment.supabaseUrl}/rest/v1`;
  const headers = {
    apikey: environment.supabaseServiceRoleKey,
    authorization: `Bearer ${environment.supabaseServiceRoleKey}`,
    "content-type": "application/json",
  };

  async function call(path, init = {}) {
    let response;
    try {
      response = await fetchImpl(`${restUrl}${path}`, {
        ...init,
        headers: { ...headers, ...init.headers },
        signal: init.signal ?? AbortSignal.timeout(environment.requestTimeoutMs),
      });
    } catch {
      throw new HttpError(503, "storage_unavailable", "Companion storage is unavailable");
    }
    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        if (!response.ok) throw publicStoreError(response, null);
        throw new HttpError(503, "storage_unavailable", "Companion storage is unavailable");
      }
    }
    if (!response.ok) throw publicStoreError(response, payload);
    return payload;
  }

  function rpc(name, body, signal) {
    return call(`/rpc/${name}`, {
      method: "POST",
      body: JSON.stringify(body),
      signal,
    });
  }

  async function select(path, signal) {
    const payload = await call(path, { method: "GET", signal });
    return Array.isArray(payload) ? payload : [];
  }

  return Object.freeze({
    async reserveQuestion(userId, requestId, now = new Date(), signal) {
      const period = calendarMonthPeriod(now);
      const rows = await rpc("reserve_wendao_question", {
        p_user_id: userId,
        p_request_id: requestId,
        p_period_start: period.start,
        p_period_end: period.end,
        p_allowance: environment.monthlyQuestionAllowance,
      }, signal);
      const reservation = Array.isArray(rows) ? rows[0] : null;
      if (!reservation) {
        throw new HttpError(503, "storage_unavailable", "Companion storage is unavailable");
      }
      return {
        state: reservation.reservation_state,
        remainingQuestions: Number(reservation.remaining_questions),
      };
    },

    async releaseQuestion(userId, requestId, signal) {
      return rpc("release_wendao_question", {
        p_user_id: userId,
        p_request_id: requestId,
      }, signal);
    },

    async finishExchange({
      userId,
      requestId,
      threadId,
      locale,
      chapterId,
      question,
      answer,
      provider,
      model,
      signal,
    }) {
      const rows = await rpc("finish_wendao_exchange", {
        p_user_id: userId,
        p_request_id: requestId,
        p_thread_id: threadId ?? null,
        p_locale: locale,
        p_chapter_id: chapterId,
        p_question: question,
        p_answer: answer,
        p_provider: provider,
        p_model: model,
      }, signal);
      const exchange = Array.isArray(rows) ? rows[0] : null;
      if (!exchange?.thread_id || !exchange?.answer_message_id) {
        throw new HttpError(503, "storage_unavailable", "Companion storage is unavailable");
      }
      return { threadId: exchange.thread_id, answerMessageId: exchange.answer_message_id };
    },

    async getContext(userId, signal) {
      const userFilter = encodeURIComponent(`eq.${userId}`);
      const accounts = await select(
        `/wendao_accounts?select=memory_enabled&user_id=${userFilter}&limit=1`,
        signal,
      );
      const memoryEnabled = accounts[0]?.memory_enabled !== false;
      const [memories, profiles] = await Promise.all([
        memoryEnabled
          ? select(
              `/wendao_memories?select=kind,summary,status,confidence,updated_at&user_id=${userFilter}&status=eq.active&order=confidence.desc,updated_at.desc&limit=5`,
              signal,
            )
          : Promise.resolve([]),
        select(
          `/wendao_profiles?select=chart_core&user_id=${userFilter}&order=updated_at.desc&limit=1`,
          signal,
        ),
      ]);
      return {
        memoryEnabled,
        memories,
        lifeManual: profiles[0]?.chart_core ?? null,
      };
    },

    async getRecentMessages(userId, threadId, signal) {
      if (!threadId) return [];
      const userFilter = encodeURIComponent(`eq.${userId}`);
      const threadFilter = encodeURIComponent(`eq.${threadId}`);
      const rows = await select(
        `/wendao_messages?select=role,content,created_at&user_id=${userFilter}&thread_id=${threadFilter}&order=created_at.desc&limit=12`,
        signal,
      );
      return rows.reverse().map(({ role, content }) => ({ role, content }));
    },

    async getCompletedExchange(userId, requestId, signal) {
      const userFilter = encodeURIComponent(`eq.${userId}`);
      const requestFilter = encodeURIComponent(`eq.${requestId}`);
      const requests = await select(
        `/wendao_question_requests?select=thread_id,answer_message_id,state&user_id=${userFilter}&request_id=${requestFilter}&limit=1`,
        signal,
      );
      const completed = requests[0];
      if (completed?.state !== "succeeded" || !completed.answer_message_id) return null;
      const answerFilter = encodeURIComponent(`eq.${completed.answer_message_id}`);
      const messages = await select(
        `/wendao_messages?select=content,provider,model&id=${answerFilter}&user_id=${userFilter}&limit=1`,
        signal,
      );
      if (!messages[0]?.content) return null;
      return {
        threadId: completed.thread_id,
        answerMessageId: completed.answer_message_id,
        answer: messages[0].content,
        provider: messages[0].provider,
        model: messages[0].model,
      };
    },
  });
}
