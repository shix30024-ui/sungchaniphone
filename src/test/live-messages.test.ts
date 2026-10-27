import { beforeEach, describe, expect, it } from "vitest";
import { CONTACTS, MESSAGES } from "@/components/phone/story";
import { LIVE_LINES, deliverLiveMessage, tickLive, saveLiveSettings, loadLiveState, DEFAULT_LIVE_SETTINGS } from "@/components/phone/live";

const msgs = () => JSON.parse(localStorage.getItem("kkt-msgs-v1") ?? "[]");

describe("Anton live messages", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("kkt-msgs-v1", JSON.stringify(MESSAGES));
    localStorage.setItem("kkt-contacts-v1", JSON.stringify(CONTACTS.map((c) => (c.id === "anton" ? { ...c, name: "안톤", unread: 0 } : c))));
  });

  it("appends without changing existing messages or contact edits", () => {
    deliverLiveMessage();
    const after = msgs();
    expect(after).toHaveLength(MESSAGES.length + 1);
    expect(after.slice(0, MESSAGES.length)).toEqual(JSON.parse(JSON.stringify(MESSAGES)));
    const anton = JSON.parse(localStorage.getItem("kkt-contacts-v1")!).find((c: { id: string }) => c.id === "anton");
    expect(anton.name).toBe("안톤");
    expect(anton.unread).toBe(1);
  });

  it("each message has ko, zh and en and is never delivered twice", () => {
    for (let i = 0; i < LIVE_LINES.length + 3; i++) deliverLiveMessage();
    const live = msgs().filter((m: { live?: boolean }) => m.live);
    expect(live).toHaveLength(LIVE_LINES.length);
    expect(new Set(live.map((m: { id: string }) => m.id)).size).toBe(LIVE_LINES.length);
    for (const m of live) if (m.type === "text") expect(m.ko && m.zh && m.en).toBeTruthy();
  });

  it("sends nothing when auto messages are off", () => {
    saveLiveSettings({ ...DEFAULT_LIVE_SETTINGS, enabled: false });
    expect(tickLive(Date.now() + 1e9)).toBeNull();
    expect(msgs()).toHaveLength(MESSAGES.length);
  });

  it("sends at most one message after a long pause", () => {
    tickLive(1000);
    expect(tickLive(1000 + 24 * 3600_000)).not.toBeNull();
    expect(tickLive(1000 + 24 * 3600_000 + 1)).toBeNull();
    expect(loadLiveState().delivered).toHaveLength(1);
  });
});
