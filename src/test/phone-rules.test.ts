import { describe, expect, it } from "vitest";
import { PASSCODE } from "@/components/phone/apps";
import { STORY_DATE, STORY_NOW, messageText, sortMessages } from "@/components/phone/chronology";
import { ALBUMS, CONTACTS, MESSAGES, NOTES, POSTS, TWEETS } from "@/components/phone/story";

describe("Fictional phone requirements", () => {
  it("preserves the required unlock code", () => expect(PASSCODE).toBe("0321"));
  it("uses the fixed story date", () => {
    expect(STORY_DATE).toBe("2026-10-26");
    expect(STORY_NOW.slice(0, 10)).toBe("2026-10-26");
  });
  it("preserves Anton's first Korean message", () => {
    expect(sortMessages(MESSAGES.filter((m) => m.contactId === "anton" && m.sender === "them" && m.type === "text"))[0]?.ko).toBe("드디어 형 카톡 추가했다ㅋㅋ");
  });
  it("provides at least six substantive messages in every story phase", () => {
    for (const year of ["2022", "2023", "2024", "2025", "2026"]) {
      expect(MESSAGES.filter((m) => m.contactId === "anton" && m.date.startsWith(year) && m.type === "text").length).toBeGreaterThanOrEqual(6);
    }
  });
  it("does not show Korean as a missing Chinese translation", () => {
    expect(messageText({ ko: "안녕", zh: "" }, "zh")).toBe("暂无翻译");
    expect(messageText({ ko: "안녕", zh: "你好" }, "ko")).toBe("안녕");
  });
  it("sorts by date, time and explicit order without changing input", () => {
    const a = [{ date: "2026-10-26", time: "10:00", order: 2 }, { date: "2022-11-14", time: "12:00", order: 0 }, { date: "2026-10-26", time: "10:00", order: 1 }];
    expect(sortMessages(a).map((m) => m.order)).toEqual([0, 1, 2]);
    expect(a[0]?.order).toBe(2);
  });
  it("includes required posts, tweets, year albums, notes and contacts", () => {
    expect(POSTS.length).toBeGreaterThanOrEqual(8);
    expect(TWEETS.length).toBeGreaterThanOrEqual(8);
    expect(ALBUMS.map((a) => a.name)).toEqual(["2023", "2024", "2025", "2026"]);
    expect(NOTES.length).toBeGreaterThanOrEqual(6);
    expect(CONTACTS.map((c) => c.id)).toEqual(expect.arrayContaining(["anton", "mom", "dad"]));
  });
});