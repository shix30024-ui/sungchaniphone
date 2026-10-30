import { STORY_DATE, nextMessageTime } from "./chronology";
import { CONTACTS, MESSAGES, type Msg } from "./story";
import { LIVE_EVENT, CONTACTS_KEY, MSGS_KEY, notifyStore, getActiveChat } from "./live";
import { readStored, updateStored, uid } from "./store";
import type { Lang } from "./i18n";
import { temporaryReply } from "./fixed-conversation";

export const DM_KEY = "ig-dm-messages-v1";
export const QUEUE_KEY = "phone-reply-queue-v1";
export type PendingReply = { channel: "kkt" | "ig"; contactId: string; sourceId: string; dueAt: number; failed?: boolean; error?: string };
import { replyFromContext } from "./reply-context";
export { replyFromContext as contextualReply } from "./reply-context";
import { buildReplyContext, type ReplyContext } from "./ai-context";
import { generatePhoneReply } from "@/lib/phone-reply.functions";
export const REPLY_ERROR_EVENT = "phone-reply-error";
type ReplyResult = { ok: true; reply: { ko: string; zh: string; en: string }; runId?: string | undefined } | { ok: false; status: number; error: string };
type Generator = (context: ReplyContext) => Promise<ReplyResult>;
let busy = false;

// Remove obsolete failed Instagram jobs left by earlier API-based builds.
// Keep all message history; only the stale queue entries are discarded.
export function pendingReplies(): PendingReply[] {
  const stored = readStored<PendingReply[]>(QUEUE_KEY, []);
  const cleaned = stored.filter((item) => !(item.channel === "ig" && item.failed));
  if (cleaned.length !== stored.length) updateStored<PendingReply[]>(QUEUE_KEY, [], () => cleaned);
  return cleaned;
}
export function sendChat(channel: "kkt" | "ig", contactId: string, text: string, lang: Lang, now = Date.now(), image?: string) {
  // Defensive boundary: Anton player text must never reach storage or the AI queue.
  if (channel === "kkt" && contactId === "anton") return temporaryReply(text, lang, undefined, image).message;
  const key = channel === "kkt" ? MSGS_KEY : DM_KEY;
  const fallback = channel === "kkt" ? MESSAGES : [];
  const existing = readStored<Msg[]>(key, fallback);
  const msg: Msg = { id: uid(), contactId, sender: "me", type: image ? "image" : "text", image: image ?? "", ko: lang === "ko" ? text : "", zh: lang === "zh" ? text : "", en: lang === "en" ? text : "", originalText: text, date: STORY_DATE, time: nextMessageTime(existing), order: Math.max(0, ...existing.map((m) => m.order)) + 1, read: false, createdAt: new Date(now).toISOString() };
  updateStored<Msg[]>(key, fallback, (rows) => [...rows, msg]);
  if ((channel === "ig" && contactId !== "yuna") || contactId === "anton") {
    updateStored<PendingReply[]>(QUEUE_KEY, [], (q) => [...q.filter((item) => !(item.channel === "ig" && item.failed)), { channel, contactId, sourceId: msg.id, dueAt: now + 2400 + Math.min(text.length * 20, 1600) }]);
  }
  return msg;
}

export async function tickReplies(now = Date.now(), activeKkt: string | null = null, generate: Generator = (context) => generatePhoneReply(context)) {
  if (busy) return null;
  busy = true;
  try {
    if (navigator.locks) return await navigator.locks.request("phone-ai-reply", { ifAvailable: true }, async (lock) => lock ? processReply(now, activeKkt, generate) : null);
    return await processReply(now, activeKkt, generate);
  } finally { busy = false; }
}

async function processReply(now: number, activeKkt: string | null, generate: Generator) {
  const queue = pendingReplies();
  // Yuna never receives an automatic reply: her thread is a one-sided fixed story.
  const item = queue.find((q) => !(q.channel === "ig" && q.contactId === "yuna") && !(q.channel === "kkt" && q.contactId === "anton") && !q.failed && q.dueAt <= now && !queue.some((prior) => prior !== q && prior.channel === q.channel && prior.contactId === q.contactId && prior.dueAt < q.dueAt && !prior.failed));
  if (!item) return null;
  const key = item.channel === "kkt" ? MSGS_KEY : DM_KEY;
  const fallback = item.channel === "kkt" ? MESSAGES : [];
  const rows = readStored<Msg[]>(key, fallback);
  const source = rows.find((m) => m.id === item.sourceId);
  const id = `reply-${item.sourceId}`;
  if (!source || rows.some((m) => m.id === id)) {
    updateStored<PendingReply[]>(QUEUE_KEY, [], (q) => q.filter((p) => p.sourceId !== item.sourceId));
    return null;
  }
  const context = buildReplyContext(rows, source);
  let result: ReplyResult;
  if (item.channel === "ig") {
    // Instagram uses the local, rule-based story reply engine; no paid API call.
    result = { ok: true, reply: replyFromContext(rows, source) };
  } else {
    try { result = await generate(context); }
    catch { result = { ok: false, status: 503, error: "AI reply connection interrupted. Your message is saved. / AI 回复连接中断，消息已保留。 / AI 연결이 끊겼습니다. 메시지는 저장됐습니다." }; }
  }
  if (!result.ok) {
    // A failure belongs only to the job that actually called the API.
    updateStored<PendingReply[]>(QUEUE_KEY, [], (q) => q.map((p) => p.sourceId === item.sourceId ? { ...p, failed: true, error: result.error } : p));
    window.dispatchEvent(new CustomEvent(REPLY_ERROR_EVENT, { detail: result.error }));
    return null;
  }
  const fresh = readStored<Msg[]>(key, fallback);
  if (item.channel === "kkt" && item.contactId === "anton") return null;
  const currentSource = fresh.find((m) => m.id === source.id);
  if (!currentSource || fresh.some((m) => m.id === id) || !pendingReplies().some((p) => p.sourceId === source.id)) return null;
  if (JSON.stringify(buildReplyContext(fresh, currentSource)) !== JSON.stringify(context)) {
    updateStored<PendingReply[]>(QUEUE_KEY, [], (q) => q.map((p) => p.sourceId === source.id ? { ...p, failed: true, error: "Message changed during reply generation. Send a new message to continue." } : p));
    return null;
  }
  const visibleChat = getActiveChat() ?? activeKkt;
  const incoming: Msg = { ...result.reply, id, contactId: item.contactId, sender: "them", type: "text", date: source.date, time: nextMessageTime(fresh), order: Math.max(0, ...fresh.map((m) => m.order)) + 1, replyTo: source.id, replyKind: "ai", live: item.channel === "kkt", read: item.channel === "kkt" && visibleChat === item.contactId };
  updateStored<Msg[]>(key, fallback, (current) => current.some((m) => m.id === id) ? current : [...current.map((m) => m.id === source.id ? { ...m, read: true } : m), incoming]);
  updateStored<PendingReply[]>(QUEUE_KEY, [], (q) => q.filter((p) => p.sourceId !== item.sourceId));
  if (item.channel === "kkt" && visibleChat !== item.contactId) {
    updateStored(CONTACTS_KEY, CONTACTS, (current) => current.map((c) => c.id === item.contactId ? { ...c, unread: c.unread + 1 } : c));
    window.dispatchEvent(new CustomEvent(LIVE_EVENT, { detail: incoming }));
  }
  notifyStore(key);
  return incoming;
}