import { sortMessages } from "./chronology";
import type { Msg } from "./story";

export type ReplyContext = { contactId: string; date: string; time: string; history: { sender: "me" | "them"; date: string; time: string; text: string; image: boolean }[] };
export function buildReplyContext(rows: Msg[], source: Msg): ReplyContext {
  const ordered = sortMessages(rows.filter((m) => m.contactId === source.contactId));
  const index = ordered.findIndex((m) => m.id === source.id);
  if (index < 0) throw new Error("Source message missing");
  return { contactId: source.contactId, date: source.date, time: source.time,
    history: ordered.slice(0, index + 1).filter((m) => m.type !== "date").slice(-60).map((m) => ({
      sender: m.sender, date: m.date, time: m.time,
      text: (m.originalText ?? [m.ko, m.zh, m.en].filter(Boolean).join(" / ")).slice(0, 4000), image: m.type === "image",
    })),
  };
}