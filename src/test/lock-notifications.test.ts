import { describe, expect, it } from "vitest";
import { ANTON_LOCK_NOTIFICATIONS, lockNotifications, withLockNotices } from "@/components/phone/lock-notifications";

describe("Fixed Anton lock notifications", () => {
  it("contains the four exact requested messages in order", () => {
    expect(lockNotifications([]).map((message) => message.zh)).toEqual([
      "哥有女朋友了？",
      "不告诉我啊hh",
      "哥不是喜欢我吗？ 有女朋友了为什么还每天抱我？",
      "哥以后别再来找我了。",
    ]);
    expect(ANTON_LOCK_NOTIFICATIONS.every((message) => message.contactId === "anton")).toBe(true);
  });
  it("removes the old cello notice and keeps notices out of the chat thread", () => {
    const old = { id: "anton-lock-cello-v1", contactId: "anton", sender: "them", type: "text", zh: "我刚刚在练习室拉大提琴突然想到哥了:)", ko: "", en: "", date: "2026-10-26", time: "", order: 1 } as const;
    expect(lockNotifications([old as any]).map((message) => message.id)).toHaveLength(4);
    const thread = [{ id: "saved-message" } as any];
    expect(withLockNotices(thread)).toEqual(thread);
  });
});
