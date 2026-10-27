import { beforeEach, describe, expect, it } from "vitest";
import { sendChat, tickReplies, pendingReplies, contextualReply, DM_KEY } from "@/components/phone/conversation";
import { MESSAGES, CONTACTS, type Msg } from "@/components/phone/story";
import { messageText } from "@/components/phone/chronology";
import { readStored, updateStored } from "@/components/phone/store";

describe("safe contextual phone conversations", () => {
  beforeEach(() => { localStorage.clear(); });
  it("keeps user originals verbatim in all three languages", () => {
    const sent = sendChat("kkt", "anton", "哥今天吃饭了吗？", "zh", 1000);
    for (const lang of ["ko", "zh", "en"] as const) expect(messageText(sent, lang)).toBe("哥今天吃饭了吗？");
    const reply = contextualReply([sent], sent);
    expect(reply.zh).toContain("还没吃");
    expect(reply.en).toContain("Not yet");
  });
  it("appends one reply and preserves manually edited records and contact names", () => {
    const saved = [{ ...MESSAGES[1], ko: "edited", id: "manual" }] as Msg[];
    localStorage.setItem("kkt-msgs-v1", JSON.stringify(saved));
    localStorage.setItem("kkt-contacts-v1", JSON.stringify(CONTACTS.map((c) => ({ ...c, name: "custom", unread: 0 }))));
    const source = sendChat("kkt", "anton", "Have you eaten?", "en", 1000);
    expect(tickReplies(1100)).toBeNull();
    expect(pendingReplies()).toHaveLength(1);
    expect(tickReplies(6000)?.replyTo).toBe(source.id);
    expect(tickReplies(7000)).toBeNull();
    const after = readStored<Msg[]>("kkt-msgs-v1", []);
    expect(after[0]).toEqual(JSON.parse(JSON.stringify(saved[0])));
    expect(after).toHaveLength(3);
    expect(readStored("kkt-contacts-v1", CONTACTS)[0]?.name).toBe("custom");
  });
  it("keeps Instagram DMs independent from KKT", () => {
    localStorage.setItem("kkt-msgs-v1", JSON.stringify(MESSAGES));
    const before = localStorage.getItem("kkt-msgs-v1");
    sendChat("ig", "minjae", "hello", "en", 1000);
    tickReplies(6000);
    expect(readStored<Msg[]>(DM_KEY, [])).toHaveLength(2);
    expect(localStorage.getItem("kkt-msgs-v1")).toBe(before);
  });
  it("refuses to overwrite unreadable saved data", () => {
    localStorage.setItem("ig-posts-v1", "broken saved value");
    expect(() => updateStored("ig-posts-v1", [], () => [])).toThrow();
    expect(localStorage.getItem("ig-posts-v1")).toBe("broken saved value");
  });
});