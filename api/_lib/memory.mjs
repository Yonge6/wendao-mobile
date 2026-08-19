const MEMORY_KINDS = new Set([
  "current_situation",
  "recurring_theme",
  "preference_boundary",
  "practice_outcome",
]);
const ALLOWED_FIELDS = new Set(["kind", "summary", "confidence", "occurredAt", "expiresAt"]);
const SENSITIVE_TEXT = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:pi|pm|cus|sub|acct)_[A-Za-z0-9_]+\b/,
  /(?:出生|生日|birth).{0,16}\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/i,
  /(?:手机|电话|phone).{0,8}\b\+?\d[\d\s-]{8,}\b/i,
];

function validTimestamp(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    throw new TypeError("Memory timestamp is invalid");
  }
  return value;
}

export function normalizeExtractedMemories(input, now = new Date()) {
  const candidates = Array.isArray(input?.memories) ? input.memories : [];
  return candidates.slice(0, 3).map((candidate) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      throw new TypeError("Memory candidate is invalid");
    }
    if (Object.keys(candidate).some((field) => !ALLOWED_FIELDS.has(field))) {
      throw new TypeError("Memory candidate includes an unsupported field");
    }
    if (!MEMORY_KINDS.has(candidate.kind)) throw new TypeError("Memory kind is invalid");
    if (typeof candidate.summary !== "string") throw new TypeError("Memory summary is invalid");
    const summary = candidate.summary.trim().replace(/\s+/g, " ");
    if (!summary || summary.length > 800) throw new TypeError("Memory summary is invalid");
    if (SENSITIVE_TEXT.some((pattern) => pattern.test(summary))) {
      throw new TypeError("Memory summary contains sensitive account or birth data");
    }
    const confidence = candidate.confidence === undefined ? 0.5 : Number(candidate.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      throw new TypeError("Memory confidence is invalid");
    }
    let expiresAt = validTimestamp(candidate.expiresAt);
    if (!expiresAt && candidate.kind === "current_situation") {
      expiresAt = new Date(now.getTime() + 90 * 86_400_000).toISOString();
    }
    if (!expiresAt && candidate.kind === "practice_outcome") {
      expiresAt = new Date(now.getTime() + 180 * 86_400_000).toISOString();
    }
    return {
      kind: candidate.kind,
      summary,
      confidence,
      occurredAt: validTimestamp(candidate.occurredAt),
      expiresAt,
    };
  });
}

export function buildMemoryExtractionMessages({ question, answer, locale }) {
  return [
    {
      role: "system",
      content: [
        "Extract zero to three durable, user-useful memories from one conversation.",
        "Return JSON only: {\"memories\":[{\"kind\":\"current_situation|recurring_theme|preference_boundary|practice_outcome\",\"summary\":\"...\",\"confidence\":0.0,\"occurredAt\":null,\"expiresAt\":null}]}",
        "Do not store greetings, scripture content, assistant advice, speculative traits, diagnoses, account/payment/contact data, or raw birth date/time/place.",
        "A memory must describe something the user explicitly said and that would improve a later conversation. Use the user's language.",
        "Return an empty memories array when nothing qualifies.",
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify({ locale, question, answer }),
    },
  ];
}
