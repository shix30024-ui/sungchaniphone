import type { Msg } from "./story";

/** Fixed lock-screen-only Anton notices; these never enter the saved chat thread. */
export const ANTON_LOCK_NOTIFICATIONS: Msg[] = [
  {
    id: "anton-lock-gf-01", contactId: "anton", sender: "them", type: "text",
    zh: "哥有女朋友了？", ko: "형 여자친구 생겼어?", en: "Hyung, do you have a girlfriend?",
    date: "2026-10-31", time: "", order: 1,
  },
  {
    id: "anton-lock-gf-02", contactId: "anton", sender: "them", type: "text",
    zh: "不告诉我啊hh", ko: "나한테는 말 안 해줬네 hh", en: "You didn't tell me hh",
    date: "2026-10-31", time: "", order: 2,
  },
  {
    id: "anton-lock-gf-03", contactId: "anton", sender: "them", type: "text",
    zh: "哥不是喜欢我吗？ 有女朋友了为什么还每天抱我？",
    ko: "형 나 좋아하는 거 아니었어? 여자친구 생겼으면서 왜 매일 나 안아 줘?",
    en: "Didn't you like me, hyung? Why do you still hug me every day if you have a girlfriend?",
    date: "2026-10-31", time: "", order: 3,
  },
  {
    id: "anton-lock-gf-04", contactId: "anton", sender: "them", type: "text",
    zh: "哥以后别再来找我了。", ko: "형 이제 나 찾아오지 마.", en: "Don't come see me anymore, hyung.",
    date: "2026-10-31", time: "", order: 4,
  },
];

export function lockNotifications(existing: Msg[]): Msg[] {
  const fixedIds = new Set([...ANTON_LOCK_NOTIFICATIONS.map((message) => message.id), "anton-lock-cello-v1", "anton-lock-busy-v1"]);
  return [...ANTON_LOCK_NOTIFICATIONS, ...existing.filter((message) => !fixedIds.has(message.id))];
}

/** These notices belong to the lock screen only, not the conversation history. */
export function withLockNotices(thread: Msg[]): Msg[] {
  return thread;
}
