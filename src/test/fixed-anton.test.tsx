import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Kakao from "@/components/phone/apps/Kakao";
import { CONTACTS, type Msg } from "@/components/phone/story";
import { sendChat, tickReplies, QUEUE_KEY } from "@/components/phone/conversation";
import { ANTON_PROGRESS_KEY, fixedFlow, EMPTY_PROGRESS } from "@/components/phone/fixed-conversation";
import { deliverLiveMessage, LIVE_LINES, LIVE_STATE_KEY, saveLiveSettings, setActiveChat, tickLive } from "@/components/phone/live";
import { addReferenceSongs, REFERENCE_SONGS } from "@/components/phone/reference-music";

vi.mock("@/lib/phone-reply.functions", () => ({
  generatePhoneReply: vi.fn(async () => ({ ok: true as const, reply: { ko: "AI 답장", zh: "AI 回复", en: "AI reply" } })),
}));

const line = (id: string, time: string, order: number, requiresReply = false): Msg => ({ id, contactId: "anton", sender: "them", type: "text", ko: `${id} 한국어`, zh: `${id} 中文`, en: id, date: "2026-10-26", time, order, requiresReply });
const saved = [line("next", "20:28", 3), line("gate", "20:27", 2, true), line("first", "20:26", 1)];
const allStorage = () => JSON.stringify(Object.fromEntries(Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)])));

describe("Fixed Anton interaction", () => {
  beforeEach(() => {
    cleanup(); localStorage.clear(); setActiveChat(null);
    localStorage.setItem("kkt-msgs-v1", JSON.stringify(saved));
    localStorage.setItem("kkt-contacts-v1", JSON.stringify(CONTACTS.map((c) => ({ ...c, unread: 0 }))));
    localStorage.setItem(LIVE_STATE_KEY, JSON.stringify({ delivered: LIVE_LINES.map((l) => l.id), nextAt: 9000 }));
  });
  it("shows all fixed lines in order even before any player reply or gate progress", () => {
    expect(fixedFlow(saved, EMPTY_PROGRESS).visible.map((m) => m.id)).toEqual(["first", "gate", "next"]);
    expect(fixedFlow(saved, { answeredIds: ["gate"] }).visible.map((m) => m.id)).toEqual(["first", "gate", "next"]);
    expect(fixedFlow(saved, EMPTY_PROGRESS).visible).toEqual([saved[2], saved[1], saved[0]]);
    expect(saved[0]?.id).toBe("next");
  });
  it("does not persist player text or enqueue it even through the legacy send boundary", () => {
    const before = allStorage();
    expect(sendChat("kkt", "anton", "  player private text  ", "zh").originalText).toBe("  player private text  ");
    expect(allStorage()).toBe(before);
  });
  it("skips old Anton AI jobs without altering them or blocking unrelated jobs", async () => {
    const ignored = { channel: "kkt", contactId: "anton", sourceId: "gate", dueAt: 0 };
    localStorage.setItem(QUEUE_KEY, JSON.stringify([ignored]));
    const generator = vi.fn(async () => ({ ok: true as const, reply: { ko: "답장", zh: "回复", en: "reply" } }));
    await tickReplies(10000, "anton", generator);
    expect(generator).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]")).toEqual([ignored]);
    sendChat("ig", "minjae", "hello", "en", 0);
    expect((await tickReplies(10000, "anton", generator))?.contactId).toBe("minjae");
    expect(generator).toHaveBeenCalledTimes(1);
  });
  it("keeps replies temporary across language changes, exit and remount; saves only gate IDs", async () => {
    localStorage.setItem("notes-v1", '[{"id":"manual","body":"keep"}]');
    const messagesBefore = localStorage.getItem("kkt-msgs-v1");
    const ui = render(<Kakao lang="en" onHome={() => {}} initialChat="anton" />);
    await screen.findByText("gate");
    expect(screen.getByText("next")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), { target: { value: "My private reply" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(screen.getByText("My private reply")).toBeInTheDocument();
    expect(screen.getByText("next")).toBeInTheDocument();
    expect(localStorage.getItem(ANTON_PROGRESS_KEY)).toBe('{"answeredIds":["gate"]}');
    expect(allStorage()).not.toContain("My private reply");
    expect(localStorage.getItem("kkt-msgs-v1")).toBe(messagesBefore);
    ui.rerender(<Kakao lang="zh" onHome={() => {}} initialChat="anton" />);
    expect(screen.getByText("My private reply")).toBeInTheDocument();
    expect(screen.getByText("next 中文")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "‹" }));
    expect(screen.queryByText("My private reply")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /찬영 Anton/ }));
    expect(screen.queryByText("My private reply")).not.toBeInTheDocument();
    expect(screen.getByText("next 中文")).toBeInTheDocument();
    ui.unmount();
    render(<Kakao lang="en" onHome={() => {}} initialChat="anton" />);
    await screen.findByText("next");
    expect(screen.queryByText("My private reply")).not.toBeInTheDocument();
    expect(localStorage.getItem("notes-v1")).toBe('[{"id":"manual","body":"keep"}]');
    expect(localStorage.getItem("kkt-msgs-v1")).toBe(messagesBefore);
  });
  it("keeps Anton accessible without overwriting a legacy contact list missing him", async () => {
    const contacts = JSON.stringify(CONTACTS.filter((c) => c.id !== "anton"));
    localStorage.setItem("kkt-contacts-v1", contacts);
    render(<Kakao lang="en" onHome={() => {}} />);
    fireEvent.click(await screen.findByRole("button", { name: /찬영 Anton/ }));
    await screen.findByText("first");
    expect(screen.getByText("gate")).toBeInTheDocument();
    expect(screen.getByText("next")).toBeInTheDocument();
    expect(localStorage.getItem("kkt-contacts-v1")).toBe(contacts);
  });
  it("sending a temporary reply never appends an undelivered story line", async () => {
    localStorage.setItem(LIVE_STATE_KEY, '{"delivered":[],"nextAt":9000}');
    const before = localStorage.getItem("kkt-msgs-v1");
    render(<Kakao lang="en" onHome={() => {}} initialChat="anton" />);
    await screen.findByText("first");
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), { target: { value: "no story creation" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(screen.getByText("no story creation")).toBeInTheDocument();
    expect(localStorage.getItem("kkt-msgs-v1")).toBe(before);
    expect(JSON.parse(localStorage.getItem(LIVE_STATE_KEY) ?? "{}").delivered).toEqual([]);
    expect(allStorage()).not.toContain("no story creation");
  });
  it("live delivery respects gates and cannot invent messages when complete, including test delivery", () => {
    expect(deliverLiveMessage()).toBeNull();
    localStorage.setItem(ANTON_PROGRESS_KEY, '{"answeredIds":["gate"]}');
    expect(deliverLiveMessage({ test: true })).toBeNull();
    expect(JSON.parse(localStorage.getItem("kkt-msgs-v1") ?? "[]")).toEqual(saved);
  });
  it("shows Anton's contextual AI answer as a temporary message that never reaches storage", async () => {
    const before = localStorage.getItem("kkt-msgs-v1");
    const ui = render(<Kakao lang="en" onHome={() => {}} initialChat="anton" />);
    await screen.findByText("first");
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), { target: { value: "what are you doing?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByText("AI reply")).toBeInTheDocument();
    expect(screen.getByText("what are you doing?")).toBeInTheDocument();
    expect(allStorage()).not.toContain("AI reply");
    expect(allStorage()).not.toContain("what are you doing?");
    expect(localStorage.getItem("kkt-msgs-v1")).toBe(before);
    fireEvent.click(screen.getByRole("button", { name: "‹" }));
    fireEvent.click(screen.getByRole("button", { name: /찬영 Anton/ }));
    expect(screen.queryByText("AI reply")).not.toBeInTheDocument();
    expect(screen.getByText("next")).toBeInTheDocument();
    ui.unmount();
  });
  it("old Anton AI jobs cannot stop the existing fixed live progress", () => {
    localStorage.setItem("kkt-msgs-v1", "[]");
    localStorage.setItem(LIVE_STATE_KEY, '{"delivered":[],"nextAt":1}');
    localStorage.setItem(QUEUE_KEY, '[{"channel":"kkt","contactId":"anton","sourceId":"old","dueAt":0}]');
    saveLiveSettings({ enabled: true, preview: true, frequency: "normal" });
    expect(tickLive(1000)?.id).toBe("live-2026-01");
  });
});

describe("Screenshot music", () => {
  it("adds all twelve specified tracks without changing saved songs or playlists", () => {
    const custom = { id: "mine", title: "bad", artist: "wave to earth", favorite: true, audio: "saved-audio" };
    const library = { songs: [custom], playlists: [{ id: "custom", name: "My playlist", songIds: ["mine"] }] };
    const result = addReferenceSongs(library);
    expect(result.songs).toHaveLength(12);
    expect(result.songs[0]).toEqual(custom);
    expect(result.playlists).toEqual(library.playlists);
    expect(REFERENCE_SONGS.map((s) => [s.title, s.artist])).toEqual([
      ["bad", "wave to earth"], ["String (feat. sunwoojunga)", "Colde"], ["넘어와 (feat. 백예린)", "DEAN"], ["Fall", "Crush"],
      ["Sunny Days, Summer Nights", "Sam Kim"], ["Dance", "offonoff"], ["그건 아마 우리의 잘못은 아닐 거야", "Yerin Baek"],
      ["EVERYTHING", "The Black Skirts"], ["peach eyes", "wave to earth"], ["Kids (Live)", "Current Joys"], ["West Coast", "Lana Del Rey"], ["Glimpse of Us", "Joji"],
    ]);
  });
  it("never reseeds edited or removed reference tracks after the first addition", () => {
    const result = addReferenceSongs({ songs: [], playlists: [] });
    const edited = { ...result, songs: [{ ...REFERENCE_SONGS[0], id: "reference-song-1", title: "My edit", artist: "Me", favorite: true }] };
    expect(addReferenceSongs(edited)).toBe(edited);
  });
});