import type { Msg } from "./story";

/** Lock-screen-only authored notices; never inserted into saved chat history. */
export const ANTON_LOCK_NOTIFICATIONS: Msg[] = [
  {
    id: "anton-lock-cello-v1", contactId: "anton", sender: "them", type: "text",
    zh: "我刚刚在练习室拉大提琴突然想到哥了:)",
    ko: "방금 연습실에서 첼로 켜다가 갑자기 형 생각났어:)",
    en: "I was just playing cello in the practice room and suddenly thought of you, hyung:)",
    date: "2026-10-26", time: "", order: 1,
  },
  {
    id: "anton-lock-busy-v1", contactId: "anton", sender: "them", type: "text",
    zh: "哥今天在忙什么？", ko: "형 오늘 뭐 하고 있어?", en: "What are you up to today, hyung?",
    date: "2026-10-26", time: "", order: 2,
  },
];

export function lockNotifications(existing: Msg[]): Msg[] {
  const fixedIds = new Set(ANTON_LOCK_NOTIFICATIONS.map((message) => message.id));
  return [...ANTON_LOCK_NOTIFICATIONS, ...existing.filter((message) => !fixedIds.has(message.id))];
}