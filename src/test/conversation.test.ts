import { beforeEach, describe, expect, it } from "vitest";
import { sendChat, tickReplies, pendingReplies, contextualReply, DM_KEY } from "@/components/phone/conversation";
import { MESSAGES, CONTACTS, type Msg } from "@/components/phone/story";
import { messageText } from "@/components/phone/chronology";
import { readStored, updateStored } from "@/components/phone/store";

describe("safe contextual phone conversations", () => {
  const generate = async () => ({ ok: true as const, reply: { ko: "테스트 답장", zh: "测试回复", en: "Test reply" } });
  beforeEach(() => { localStorage.clear(); });
  it("keeps user originals verbatim in all three languages", () => {
    const sent = sendChat("kkt", "anton", "哥今天吃饭了吗？", "zh", 1000);
    for (const lang of ["ko", "zh", "en"] as const) expect(messageText(sent, lang)).toBe("哥今天吃饭了吗？");
    const reply = contextualReply([sent], sent);
    expect(reply.zh).toContain("还没吃");
    expect(reply.en).toContain("Not yet");
  });
  it("appends one reply and preserves manually edited records and contact names", async () => {
    const saved = [{ ...MESSAGES[1], ko: "edited", id: "manual" }] as Msg[];
    localStorage.setItem(DM_KEY, JSON.stringify(saved));
    localStorage.setItem("kkt-contacts-v1", JSON.stringify(CONTACTS.map((c) => ({ ...c, name: "custom", unread: 0 }))));
    const source = sendChat("ig", "anton", "Have you eaten?", "en", 1000);
    expect(await tickReplies(1100, null, generate)).toBeNull();
    expect(pendingReplies()).toHaveLength(1);
    expect((await tickReplies(6000, null, generate))?.replyTo).toBe(source.id);
    expect(await tickReplies(7000, null, generate)).toBeNull();
    const after = readStored<Msg[]>(DM_KEY, []);
    expect(after[0]).toEqual(JSON.parse(JSON.stringify(saved[0])));
    expect(after).toHaveLength(3);
    expect(readStored("kkt-contacts-v1", CONTACTS)[0]?.name).toBe("custom");
  });
  it("keeps Instagram DMs independent from KKT", async () => {
    localStorage.setItem("kkt-msgs-v1", JSON.stringify(MESSAGES));
    const before = localStorage.getItem("kkt-msgs-v1");
    sendChat("ig", "minjae", "hello", "en", 1000);
    await tickReplies(6000, null, generate);
    expect(readStored<Msg[]>(DM_KEY, [])).toHaveLength(2);
    expect(localStorage.getItem("kkt-msgs-v1")).toBe(before);
  });
  it("refuses to overwrite unreadable saved data", () => {
    localStorage.setItem("ig-posts-v1", "broken saved value");
    expect(() => updateStored("ig-posts-v1", [], () => [])).toThrow();
    expect(localStorage.getItem("ig-posts-v1")).toBe("broken saved value");
  });
  it("keeps one AI request in flight and preserves unrelated edits", async () => {
    sendChat("ig", "anton", "今天好累", "zh", 1000);
    let resolve: (value: Awaited<ReturnType<typeof generate>>) => void = () => {};
    const waiting = new Promise<Awaited<ReturnType<typeof generate>>>((done) => { resolve = done; });
    const first = tickReplies(6000, null, () => waiting);
    expect(await tickReplies(6000, null, generate)).toBeNull();
    expect(pendingReplies()).toHaveLength(1);
    resolve(await generate());
    expect((await first)?.replyKind).toBe("ai");
    expect(pendingReplies()).toHaveLength(0);
  });
  it("stops failed requests without fabricating a character response", async () => {
    sendChat("ig", "anton", "吃饭了吗？", "zh", 1000);
    const before = localStorage.getItem(DM_KEY);
    await tickReplies(6000, null, async () => ({ ok: false, status: 403, error: "AI unavailable" }));
    expect(localStorage.getItem(DM_KEY)).toBe(before);
    expect(pendingReplies()[0]?.failed).toBe(true);
    expect(await tickReplies(7000, null, generate)).toBeNull();
  });
  it("responds to fatigue before other topics", () => {
    const sent = sendChat("kkt", "anton", "我今天练习好累", "zh", 1000);
    const reply = contextualReply([sent], sent);
    expect(reply.zh).toContain("先歇一会儿");
    expect(reply.zh).not.toContain("周四");
  });
  it("continues a brief agreement without inventing another invitation", () => {
    const previous: Msg = { id: "agreed", contactId: "anton", sender: "them", type: "text", ko: "정문에서 만나", zh: "在正门见面", en: "Meet at the main gate", date: "2026-10-26", time: "20:26", order: 0 };
    const source = { ...previous, id: "short", sender: "me" as const, originalText: "好", time: "20:27", order: 1 };
    expect(contextualReply([previous, source], source).zh).toContain("按刚才说的来");
  });
  it("does not invent image details", () => {
    const source = sendChat("kkt", "anton", "", "zh", 1000, "data:image/png;base64,test");
    expect(contextualReply([source], source).zh).toBe("收到照片了，跟我说说拍的是什么？");
  });
  it("remembers an earlier uneaten meal rather than rotating replies", () => {
    const source = sendChat("kkt", "anton", "吃饭了吗？", "zh", 1000);
    const prior = { ...source, id: "prior", sender: "them" as const, originalText: "还没吃", time: "20:26", order: 0 };
    expect(contextualReply([prior, source], source).zh).toContain("像刚才说的");
  });
});