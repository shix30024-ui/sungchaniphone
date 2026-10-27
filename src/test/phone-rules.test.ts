import { describe, expect, it } from "vitest";
import { PASSCODE } from "@/components/phone/apps";
import { STORY_DATE, STORY_NOW, messageText, sortMessages } from "@/components/phone/chronology";
import { ALBUMS, CONTACTS, MESSAGES, NOTES, POSTS, TWEETS } from "@/components/phone/story";
import { completeTranslations } from "@/components/phone/translations";
import { movePhoto, moveImage, postImages } from "@/components/phone/media";
import { monthCells } from "@/components/phone/organizer";

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
  it("follows the system English language for every existing substantive chat", () => {
    const completed = completeTranslations(MESSAGES);
    expect(completed.filter((m) => m.type === "text" || m.type === "system").every((m) => Boolean(m.en))).toBe(true);
    const first = completed.find((m) => m.ko === "드디어 형 카톡 추가했다ㅋㅋ");
    expect(first && messageText(first, "en")).toBe("Finally added you on KakaoTalk, hyung lol.");
  });
  it("never overwrites saved English or other language edits", () => {
    const original = MESSAGES.find((m) => m.ko === "드디어 형 카톡 추가했다ㅋㅋ");
    if (!original) throw new Error("Missing required first message");
    const saved = { ...original, en: "My edited English", zh: "我保存的文字" };
    expect(completeTranslations([saved])[0]).toEqual(saved);
    expect(completeTranslations([{ ...saved, en: "" }])[0]?.en).toBe("");
    expect(messageText({ ko: "안녕", zh: "你好" }, "en")).toBe("Translation missing — add in Edit");
  });
  it("keeps captions and comments intact when ordering legacy post images", () => {
    const post = POSTS[0];
    if (!post) throw new Error("Missing existing post");
    expect(postImages(post)).toEqual([post.image]);
    expect(moveImage(["one", "two", "three"], 1, -1)).toEqual(["two", "one", "three"]);
    expect(post.caption).toBe("마지막 가을 학기 🍂");
    expect(post.comments.length).toBe(2);
  });
  it("moves photos without changing their IDs, dates or notes", () => {
    const albums = [{ id: "a", name: "A", photos: [{ id: "p", image: "original", date: "2025-03-22", note: "saved" }] }, { id: "b", name: "B", photos: [] }];
    const moved = movePhoto(albums, "a", "b", "p");
    expect(moved[0]?.photos).toEqual([]);
    expect(moved[1]?.photos).toEqual(albums[0]?.photos);
    expect(albums[0]?.photos.length).toBe(1);
  });
  it("renders the correct October 2026 calendar dates", () => {
    const cells = monthCells(2026, 9);
    expect(cells.slice(0, 5)).toEqual([null, null, null, null, 1]);
    expect(cells.at(-1)).toBe(31);
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