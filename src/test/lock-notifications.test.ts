import { describe, expect, it } from "vitest";
import { ANTON_LOCK_NOTIFICATIONS, lockNotifications } from "@/components/phone/lock-notifications";

describe("Fixed Anton lock notifications", () => {
  it("contains both exact requested lines in the requested order", () => {
    expect(lockNotifications([]).map((message) => message.zh)).toEqual([
      "我刚刚在练习室拉大提琴突然想到哥了:)", "哥今天在忙什么？",
    ]);
    expect(lockNotifications([]).every((message) => message.contactId === "anton")).toBe(true);
  });
  it("preserves existing messages and never writes fixed notices into phone storage", () => {
    const fixed = ANTON_LOCK_NOTIFICATIONS[0];
    if (!fixed) throw new Error("Fixed notification missing");
    const existing = [{ ...fixed, id: "owner-edited", zh: "保留我改过的内容", time: "20:31" }];
    const before = JSON.stringify(existing);
    const writes = Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)]);
    expect(lockNotifications(existing).slice(2)).toEqual(existing);
    expect(JSON.stringify(existing)).toBe(before);
    expect(Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)])).toEqual(writes);
    expect(lockNotifications(lockNotifications(existing))).toHaveLength(3);
  });
});
import { withLockNotices as wln } from "@/components/phone/lock-notifications";
import { test as t2, expect as e2 } from "vitest";
t2("Anton chat shows both lock notices last, once", () => {
  const base = [{ id: "a1" } as any];
  const out = wln(wln(base));
  e2(out.map((m) => m.id)).toEqual(["a1", "anton-lock-cello-v1", "anton-lock-busy-v1"]);
});
