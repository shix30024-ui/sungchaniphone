import type { ReplyContext } from "@/components/phone/ai-context";

const ENDPOINT = "https://ajuumztqrqgnvbnpzhac.supabase.co/functions/v1/anton-chat";

type Reply = { ko: string; zh: string; en: string };

export async function generateReply(sharedSecret: string, context: ReplyContext) {
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-chat-secret": sharedSecret,
      },
      body: JSON.stringify({ context }),
      signal: AbortSignal.timeout(45000),
    });

    const payload = await response.json().catch(() => ({})) as {
      reply?: Partial<Reply>;
      error?: string;
    };

    if (!response.ok) {
      return {
        ok: false as const,
        status: response.status,
        error: (payload.error || "AI reply service is temporarily unavailable.").slice(0, 500),
      };
    }

    const reply = payload.reply;
    if (
      !reply ||
      typeof reply.ko !== "string" || !reply.ko.trim() ||
      typeof reply.zh !== "string" || !reply.zh.trim() ||
      typeof reply.en !== "string" || !reply.en.trim()
    ) {
      return { ok: false as const, status: 502, error: "AI reply service returned an invalid response." };
    }

    return {
      ok: true as const,
      reply: { ko: reply.ko.trim(), zh: reply.zh.trim(), en: reply.en.trim() },
    };
  } catch {
    return { ok: false as const, status: 503, error: "AI reply service could not be reached. Your message is saved." };
  }
}
