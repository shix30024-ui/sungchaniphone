import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Notes from "@/components/phone/apps/Notes";
import { unlockOwner } from "@/components/phone/owner";
import { setSharedOwner } from "@/components/phone/shared-state";

const note = {
  id: "custom-language-note", title: "Original", body: "Original body", date: "2026-10-26",
  translations: {
    en: { title: "English note", body: "English body" },
    ko: { title: "한국어 메모", body: "한국어 내용" },
    zh: { title: "中文备忘录", body: "中文内容" },
  },
};

describe("Notes system language", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    setSharedOwner(false);
    localStorage.setItem("notes-v1", JSON.stringify([note]));
  });

  it("reads the open note in the phone language when that language changes", async () => {
    const ui = render(<Notes lang="en" onHome={() => {}} />);
    fireEvent.click(await screen.findByRole("button", { name: /English note/ }));
    expect(screen.getByText("English body")).toBeInTheDocument();
    ui.rerender(<Notes lang="zh" onHome={() => {}} />);
    expect(screen.getByText("中文内容")).toBeInTheDocument();
    ui.rerender(<Notes lang="ko" onHome={() => {}} />);
    expect(screen.getByText("한국어 내용")).toBeInTheDocument();
    expect(localStorage.getItem("notes-v1")).toBe(JSON.stringify([note]));
  });

  it("edits only the current system-language version and preserves other versions", async () => {
    setSharedOwner(true);
    unlockOwner("0321");
    const ui = render(<Notes lang="en" onHome={() => {}} />);
    fireEvent.click(await screen.findByRole("button", { name: /English note/ }));
    ui.rerender(<Notes lang="zh" onHome={() => {}} />);
    expect(screen.getByRole("textbox", { name: "标题" })).toHaveValue("中文备忘录");
    fireEvent.change(screen.getByRole("textbox", { name: "标题" }), { target: { value: "我的中文修改" } });
    ui.rerender(<Notes lang="en" onHome={() => {}} />);
    expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("English note");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const saved = JSON.parse(localStorage.getItem("notes-v1") ?? "[]")[0];
    expect(saved.translations.zh.title).toBe("我的中文修改");
    expect(saved.translations.en).toEqual(note.translations.en);
    expect(saved.translations.ko).toEqual(note.translations.ko);
    expect(saved.title).toBe("Original");
  });
});