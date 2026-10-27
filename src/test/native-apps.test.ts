import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_APPS, loadApps } from "@/components/phone/apps";
import { browserDestination, safeBrowserUrl, BROWSER_PAGES_KEY } from "@/components/phone/browser";
import { SMS_MESSAGES_KEY } from "@/components/phone/sms";
import { updateStored } from "@/components/phone/store";

describe("Native app preservation", () => {
  beforeEach(() => localStorage.clear());
  it("removes only TikTok from a customized saved home screen", () => {
    const saved = [{ ...DEFAULT_APPS[0], id: "tiktok", name: "Saved TikTok" }, ...DEFAULT_APPS.map((app) => ({ ...app, name: `Custom ${app.name}` }))].reverse();
    localStorage.setItem("phone-apps-v2", JSON.stringify(saved));
    localStorage.setItem("phone-calendar-added-v1", "true");
    localStorage.setItem("phone-apps-removed-v1", "true");
    expect(loadApps()).toEqual(saved.filter((app) => app.id !== "tiktok"));
    expect(loadApps().some((app) => app.id === "tiktok")).toBe(false);
    expect(DEFAULT_APPS.some((app) => app.id === "tiktok")).toBe(false);
  });
  it("keeps manually re-added apps after the one-time removal", () => {
    localStorage.setItem("phone-apps-v2", JSON.stringify(DEFAULT_APPS));
    loadApps();
    const next = [...DEFAULT_APPS, { ...DEFAULT_APPS[0], id: "tiktok", name: "Readded" }];
    localStorage.setItem("phone-apps-v2", JSON.stringify(next));
    expect(loadApps()).toEqual(next);
  });
  it("saves Messages and browser edits without altering KKT or Notes", () => {
    const kkt = '[{"id":"saved","ko":"수정"}]';
    const notes = '[{"id":"note","title":"My saved title","body":"My saved content"}]';
    localStorage.setItem("kkt-msgs-v1", kkt);
    localStorage.setItem("notes-v1", notes);
    updateStored(SMS_MESSAGES_KEY, [], () => [{ id: "sms", text: "Edited SMS" }]);
    updateStored(BROWSER_PAGES_KEY, [], () => [{ id: "site", title: "Edited favorite" }]);
    expect(localStorage.getItem("kkt-msgs-v1")).toBe(kkt);
    expect(localStorage.getItem("notes-v1")).toBe(notes);
  });
  it("rejects executable browser URLs and supports addresses and searches", () => {
    expect(safeBrowserUrl("javascript:alert(1)")).toBe(null);
    expect(safeBrowserUrl("data:text/html,test")).toBe(null);
    expect(safeBrowserUrl("example.com")).toBe("https://example.com/");
    expect(browserDestination("Seoul campus")).toBe("https://www.google.com/search?q=Seoul%20campus");
  });
});