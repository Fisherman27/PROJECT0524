export function sanitizeAgentJson(text: string): string {
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("MODEL_RESPONSE_INVALID");
  return cleaned.slice(start, end + 1);
}

export function parseAgentJson<T>(raw: string): T {
  try {
    const cleaned = sanitizeAgentJson(raw);
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error("MODEL_RESPONSE_INVALID");
  }
}

export function ensureArray<T>(value: unknown, fallback: T[] = []): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

export function ensureString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}
