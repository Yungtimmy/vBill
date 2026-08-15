type Level = "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

const SENSITIVE = /(secret|token|password|authorization|cookie|private.?key|seed|mnemonic|api.?key)/i;

function redact(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.startsWith("0x") && value.length === 66) return value;
    if (SENSITIVE.test(value) && value.length > 12) return "[redacted]";
    return value;
  }
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE.test(k) ? "[redacted]" : redact(v);
    }
    return out;
  }
  return value;
}

function write(level: Level, message: string, fields?: LogFields) {
  const line = {
    ts: new Date().toISOString(),
    level,
    message,
    ...((fields ? (redact(fields) as LogFields) : {}) as LogFields),
  };
  const text = JSON.stringify(line);
  if (level === "error") console.error(text);
  else if (level === "warn") console.warn(text);
  else console.info(text);
}

export const logger = {
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
};
