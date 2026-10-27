import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({
  contactId: z.string().min(1).max(80), date: z.string().max(10), time: z.string().max(5),
  history: z.array(z.object({ sender: z.enum(["me", "them"]), date: z.string().max(10), time: z.string().max(5), text: z.string().max(4000), image: z.boolean() })).min(1).max(60),
});
export const generatePhoneReply = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false as const, status: 503, error: "AI reply connection is not configured." };
    const { generateReply } = await import("./phone-reply.server");
    return generateReply(key, data);
  });