import type {
  CompanionMemoryState,
  MemoryCandidate,
  MemoryKind,
  MemoryStatus,
} from "./types";

const MEMORY_KINDS = new Set<MemoryKind>([
  "current_situation",
  "recurring_theme",
  "preference_boundary",
  "practice_outcome",
  "life_manual_context",
]);

const SENSITIVE_FIELD_NAMES = new Set([
  "email",
  "phone",
  "appleid",
  "googleid",
  "provideruserid",
  "paymentid",
  "paymentmethod",
  "stripeid",
  "birthdate",
  "birthtime",
  "birthplace",
]);

function normalizedFieldName(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function validOptionalTimestamp(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    throw new TypeError(`${field} must be an ISO timestamp`);
  }
  return value;
}

export function normalizeMemoryCandidate(input: unknown): MemoryCandidate {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Memory candidate must be an object");
  }

  const record = input as Record<string, unknown>;
  for (const field of Object.keys(record)) {
    if (SENSITIVE_FIELD_NAMES.has(normalizedFieldName(field))) {
      throw new TypeError(`Sensitive field is not allowed in memory: ${field}`);
    }
  }

  if (typeof record.kind !== "string" || !MEMORY_KINDS.has(record.kind as MemoryKind)) {
    throw new TypeError("Memory kind is invalid");
  }

  if (typeof record.summary !== "string") {
    throw new TypeError("Memory summary must be text");
  }
  const summary = record.summary.trim().replace(/\s+/g, " ");
  if (!summary || summary.length > 800) {
    throw new RangeError("Memory summary must contain 1 to 800 characters");
  }

  const confidence = record.confidence === undefined ? 0.5 : Number(record.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new RangeError("Memory confidence must be between 0 and 1");
  }

  return {
    kind: record.kind as MemoryKind,
    summary,
    confidence,
    occurredAt: validOptionalTimestamp(record.occurredAt, "occurredAt"),
    expiresAt: validOptionalTimestamp(record.expiresAt, "expiresAt"),
  };
}

export function resolveMemoryStatus(
  memory: CompanionMemoryState,
  now = new Date(),
): MemoryStatus {
  if (memory.status !== "active" || !memory.expiresAt) return memory.status;
  const expiresAt = Date.parse(memory.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt <= now.getTime()
    ? "expired"
    : "active";
}

export function isMemoryRetrievable(
  memory: CompanionMemoryState,
  memoryEnabled: boolean,
  now = new Date(),
): boolean {
  return memoryEnabled && resolveMemoryStatus(memory, now) === "active";
}

