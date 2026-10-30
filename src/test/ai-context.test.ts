import { describe, expect, it } from "vitest";
import { buildReplyContext } from "@/components/phone/ai-context";
import { localClock } from "@/components/phone/clock";
import type { Msg } from "@/components/phone/story";
const msg = (id: string, order: number, text: string, contactId = "anton"): Msg => ({ id, order, originalText: text, contactId, sender: "me", type: "text", date: "2026-10-26", time: "20:26", ko: "", zh: "" });
describe("Context and player clock", () => {
  it("keeps Anton visible order and prior session answers despite earlier device times", () => {
    const rows = [msg("fixed", 90, "哥今天在忙什么？"), msg("player", 90, "我吃了番茄面"), { ...msg("ai", 90, "听起来不错"), sender: "them" as const }, msg("followup", 90, "我刚才吃的是什么？")];
    const first = rows[0];
    const source = rows[3];
    if (!first || !source) throw new Error("Missing fixture");
    first.time = "23:59";
    const before = JSON.stringify(rows);
    expect(buildReplyContext(rows, source, true).history.map((m) => m.text)).toEqual(["哥今天在忙什么？", "我吃了番茄面", "听起来不错", "我刚才吃的是什么？"]);
    expect(JSON.stringify(rows)).toBe(before);
  });
  it("reads preceding statements and source but never future or other-contact messages", () => {
    const source = msg("source", 2, "好");
    expect(buildReplyContext([msg("prior", 1, "在正门见"), source, msg("future", 3, "future secret"), msg("other", 0, "private", "mom")], source).history.map((m) => m.text)).toEqual(["在正门见", "好"]);
  });
  it("does not include image data or invent visible details", () => {
    const source = { ...msg("photo", 1, "练习结束了"), type: "image" as const, image: "data:image/png;base64,private" };
    const context = buildReplyContext([source], source);
    expect(context.history[0]).toEqual({ sender: "me", date: "2026-10-26", time: "20:26", text: "练习结束了", image: true });
    expect(JSON.stringify(context)).not.toContain("base64");
  });
  it("uses device local hours and minutes rather than frozen story time", () => {
    expect(localClock(new Date(2026, 9, 28, 1, 5, 0))).toBe("1:05");
    expect(localClock(new Date(2026, 9, 28, 16, 59, 0))).toBe("16:59");
  });
});