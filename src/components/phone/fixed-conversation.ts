import { STORY_DATE, sortMessages } from "./chronology";
import type { Lang } from "./i18n";
import type { Msg } from "./story";
import { readStored, updateStored, uid } from "./store";
import { queueSharedSave } from "./shared-state";

export const ANTON_PROGRESS_KEY = "kkt-anton-fixed-progress-v1";
export type FixedProgress = { answeredIds: string[] };
export type TemporaryReply = { message: Msg; afterId?: string | undefined };
export const EMPTY_PROGRESS: FixedProgress = { answeredIds: [] };

export function fixedFlow(messages: Msg[], progress: FixedProgress) {
  // Fixed reply gates are exclusive to Anton. Other contacts must show their
  // own complete saved thread instead of being filtered out as non-Anton rows.
  const ordered = sortMessages(messages);
  const index = ordered.findIndex((m) => m.contactId === "anton" && m.sender === "them" && m.requiresReply && !progress.answeredIds.includes(m.id));
  return { visible: ordered, waiting: index < 0 ? undefined : ordered[index] };
}

/** Only a fixed node ID is persisted. Player text never enters this function. */
export function acknowledgeFixedNode(id: string) {
  return updateStored<FixedProgress>(ANTON_PROGRESS_KEY, EMPTY_PROGRESS, (old) =>
    old.answeredIds.includes(id) ? old : { ...old, answeredIds: [...old.answeredIds, id] });
}

export function readFixedProgress() { return readStored(ANTON_PROGRESS_KEY, EMPTY_PROGRESS); }

/** This object belongs only to React state, never the saved message collection. */
export function temporaryReply(text: string, lang: Lang, after?: Msg, image?: string): TemporaryReply {
  const now = new Date();
  return { afterId: after?.id, message: {
    id: `temporary-${uid()}`, contactId: "anton", sender: "me", type: image ? "image" : "text",
    ko: lang === "ko" ? text : "", zh: lang === "zh" ? text : "", en: lang === "en" ? text : "",
    originalText: text, image, date: after?.date ?? STORY_DATE,
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    order: after?.order ?? 0, read: true,
  } };
}

/** Anton's contextual answer to the player. Also React-state only: it never enters storage. */
export function temporaryIncoming(reply: { ko: string; zh: string; en: string }, after?: Msg): TemporaryReply {
  const now = new Date();
  return { afterId: after?.id, message: {
    id: `temporary-${uid()}`, contactId: "anton", sender: "them", type: "text",
    ko: reply.ko, zh: reply.zh, en: reply.en, date: after?.date ?? STORY_DATE,
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    order: after?.order ?? 0, read: true, ...(after ? { replyTo: after.id } : {}), replyKind: "ai",
  } };
}

// Temporary replies stay separate from authored KKT records, while their
// local cache preserves already-triggered conversations across page refreshes.
const TEMPORARY_KEY_PREFIX = "kkt-temporary-replies-v1:";
const temporaryStore = new Map<string, TemporaryReply[]>();

export function readTemporaryReplies(contactId: string): TemporaryReply[] {
  const cached = temporaryStore.get(contactId);
  if (cached) return cached;
  let saved: TemporaryReply[] = [];
  if (typeof window !== "undefined") {
    try {
      // Read through the shared phone store first, while retaining compatibility
      // with temporary conversations saved by earlier local-only versions.
      const stored = readStored<TemporaryReply[]>(`${TEMPORARY_KEY_PREFIX}${contactId}`, []);
      if (Array.isArray(stored)) saved = stored;
    } catch { /* Keep the current conversation usable if this optional cache is unreadable. */ }
  }
  temporaryStore.set(contactId, saved);
  return saved;
}

export function writeTemporaryReplies(contactId: string, replies: TemporaryReply[]) {
  temporaryStore.set(contactId, replies);
  if (typeof window !== "undefined") {
    try {
      // The same shared persistence path as story progress prevents the two
      // records from drifting between the editor and the published phone.
      const key = `${TEMPORARY_KEY_PREFIX}${contactId}`;
      updateStored<TemporaryReply[]>(key, [], () => replies);
      queueSharedSave(key, replies);
    } catch { /* A storage failure must not interrupt the open conversation. */ }
  }
}

/** Test helper: clears only the in-memory cache; saved conversation history remains intact. */
export function resetTemporaryReplies() { temporaryStore.clear(); }

export function withTemporaryReplies(fixed: Msg[], temporary: TemporaryReply[]): Msg[] {
  const result = temporary.filter((r) => !r.afterId).map((r) => r.message);
  const pending = temporary.filter((r) => r.afterId);
  for (const message of fixed) {
    result.push(message);
    // Drain replies whose anchor is already visible, including chains anchored
    // on another temporary message (player reply → Anton's AI answer).
    let inserted = true;
    while (inserted) {
      inserted = false;
      for (let i = pending.length - 1; i >= 0; i--) {
        const r = pending[i];
        if (!r) continue;
        const at = result.findIndex((m) => m.id === r.afterId);
        if (at >= 0) { result.splice(at + 1, 0, r.message); pending.splice(i, 1); inserted = true; }
      }
    }
  }
  for (const r of pending) {
    const at = result.findIndex((m) => m.id === r.afterId);
    if (at >= 0) result.splice(at + 1, 0, r.message);
  }
  return result;
}