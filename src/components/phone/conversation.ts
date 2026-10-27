import { STORY_DATE, nextMessageTime } from "./chronology";
import { CONTACTS, MESSAGES, type Msg } from "./story";
import { LIVE_EVENT, CONTACTS_KEY, MSGS_KEY, notifyStore } from "./live";
import { readStored, updateStored, uid } from "./store";
import type { Lang } from "./i18n";

export const DM_KEY = "ig-dm-messages-v1";
export const QUEUE_KEY = "phone-reply-queue-v1";
export type PendingReply = { channel: "kkt" | "ig"; contactId: string; sourceId: string; dueAt: number };
export { replyFromContext as contextualReply } from "./reply-context";
import { replyFromContext } from "./reply-context";

export function pendingReplies(): PendingReply[] { return readStored<PendingReply[]>(QUEUE_KEY, []); }
export function sendChat(channel: "kkt" | "ig", contactId: string, text: string, lang: Lang, now = Date.now(), image?: string) {
  const key = channel === "kkt" ? MSGS_KEY : DM_KEY;
  const fallback = channel === "kkt" ? MESSAGES : [];
  const existing = readStored<Msg[]>(key, fallback);
  const msg: Msg = { id: uid(), contactId, sender: "me", type: image ? "image" : "text", image: image ?? "", ko: lang === "ko" ? text : "", zh: lang === "zh" ? text : "", en: lang === "en" ? text : "", originalText: text, date: STORY_DATE, time: nextMessageTime(existing), order: Math.max(0, ...existing.map((m) => m.order)) + 1, read: false, createdAt: new Date(now).toISOString() };
  updateStored<Msg[]>(key, fallback, (rows) => [...rows, msg]);
  if (channel === "ig" || contactId === "anton") {
    updateStored<PendingReply[]>(QUEUE_KEY, [], (q) => [...q, { channel, contactId, sourceId: msg.id, dueAt: now + 2400 + Math.min(text.length * 20, 1600) }]);
  }
  return msg;
}

export function tickReplies(now = Date.now(), activeKkt: string | null = null) {
  const queue = pendingReplies();
  const item = queue.find((q) => q.dueAt <= now);
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
  const reply = replyFromContext(rows.filter((m) => m.contactId === item.contactId), source);
  const incoming: Msg = { ...reply, id, contactId: item.contactId, sender: "them", type: "text", date: STORY_DATE, time: nextMessageTime(rows), order: Math.max(0, ...rows.map((m) => m.order)) + 1, replyTo: source.id, replyKind: "preset", live: item.channel === "kkt", read: item.channel === "kkt" && activeKkt === item.contactId };
  updateStored<Msg[]>(key, fallback, (current) => [...current.map((m) => m.id === source.id ? { ...m, read: true } : m), incoming]);
  updateStored<PendingReply[]>(QUEUE_KEY, [], (q) => q.filter((p) => p.sourceId !== item.sourceId));
  if (item.channel === "kkt" && activeKkt !== item.contactId) {
    updateStored(CONTACTS_KEY, CONTACTS, (current) => current.map((c) => c.id === item.contactId ? { ...c, unread: c.unread + 1 } : c));
    window.dispatchEvent(new CustomEvent(LIVE_EVENT, { detail: incoming }));
  }
  notifyStore(key);
  return incoming;
}