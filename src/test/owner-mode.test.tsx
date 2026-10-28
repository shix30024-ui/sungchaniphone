import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Kakao from "@/components/phone/apps/Kakao";
import { CONTACTS, type Msg } from "@/components/phone/story";
import { OWNER_KEY, OWNER_CODE, lockOwner, readOwner, unlockOwner } from "@/components/phone/owner";

vi.mock("@/lib/phone-reply.functions", () => ({
  generatePhoneReply: vi.fn(async () => ({ ok: true as const, reply: { ko: "답장", zh: "回复", en: "reply" } })),
}));

const line = (id: string, order: number): Msg => ({ id, contactId: "anton", sender: "them", type: "text", ko: id, zh: id, en: id, date: "2026-10-26", time: "20:26", order });

describe("Owner mode", () => {
  beforeEach(() => { cleanup(); localStorage.clear(); });
  it("unlocks only with the exact owner code and locks again", () => {
    expect(readOwner()).toBe(false);
    expect(unlockOwner("0000")).toBe(false);
    expect(unlockOwner("1026")).toBe(false);
    expect(readOwner()).toBe(false);
    expect(unlockOwner("0321")).toBe(true);
    expect(readOwner()).toBe(true);
    expect(localStorage.getItem(OWNER_KEY)).toBe('{"unlocked":true}');
    lockOwner();
    expect(readOwner()).toBe(false);
  });
  it("hides the chat edit entry from players and shows it to the owner", async () => {
    localStorage.setItem("kkt-msgs-v1", JSON.stringify([line("first", 1)]));
    localStorage.setItem("kkt-contacts-v1", JSON.stringify(CONTACTS));
    const ui = render(<Kakao lang="en" onHome={() => {}} initialChat="anton" />);
    await screen.findByText("first");
    // Players can open the chat menu but find no Edit option.
    const menuButtons = screen.getAllByRole("button", { name: "Chat menu" });
    fireEvent.click(menuButtons[0]!);
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    ui.unmount();
    // The owner sees the Edit option.
    unlockOwner(OWNER_CODE);
    render(<Kakao lang="en" onHome={() => {}} initialChat="anton" />);
    await screen.findByText("first");
    fireEvent.click(screen.getAllByRole("button", { name: "Chat menu" })[0]!);
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });
});
