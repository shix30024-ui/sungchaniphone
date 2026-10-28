import { STORY_DATE, sortMessages } from "./chronology";
import type { Lang } from "./i18n";
import type { Msg } from "./story";
import { readStored, updateStored, uid } from "./store";

export const ANTON_PROGRESS_KEY = "kkt-anton-fixed-progress-v1";
export type FixedProgress = { answeredIds: string[] };
export type TemporaryReply = { message: Msg; afterId?: string | undefined };
export const EMPTY_PROGRESS: FixedProgress = { answeredIds: [] };

export function fixedFlow(messages: Msg[], progress: FixedProgress) {
  const ordered = sortMessages(messages.filter((m) => m.contactId === "anton"));
  const index = ordered.findIndex((m) => m.sender === "them" && m.requiresReply && !progress.answeredIds.includes(m.id));
  // Gates track existing progress only; they never hide already-authored records.
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

export function withTemporaryReplies(fixed: Msg[], temporary: TemporaryReply[]): Msg[] {
  const result = temporary.filter((r) => !r.afterId).map((r) => r.message);
  for (const message of fixed) {
    result.push(message, ...temporary.filter((r) => r.afterId === message.id).map((r) => r.message));
  }
  return result;
}