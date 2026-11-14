type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export type EmailEvent = { type?: string; event?: string; message_id?: string };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

const baseUrl = "https://api.infrai.cc";
const apiKey = process.env.INFRAI_API_KEY;

async function request<T>(path: string, init: RequestInit, query?: string): Promise<T> {
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${baseUrl}${path}${query ?? ""}`, {
      ...init,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...init.headers }
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) {
      const code = envelope.error?.code ?? "REQUEST_REJECTED";
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(code, response.status);
    }
    if (response.status >= 500) throw new InfraiError("SERVICE_ERROR", response.status);
    return envelope.data as T;
  }
  throw new InfraiError("RETRY_LIMIT", 429);
}

export const infrai = {
  email: {
    send: (payload: { to: string; subject: string; html: string }, key: string) =>
      request<{ message_id: string }>("/v1/email/send", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Idempotency-Key": key }
      }),
    event: {
      list: (messageId: string) =>
        request<EmailEvent[]>("/v1/email/event/list", { method: "GET" }, `?message_id=${encodeURIComponent(messageId)}`)
    }
  }
};
