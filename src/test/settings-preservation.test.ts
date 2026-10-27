import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_APPS, loadApps, PASSCODE } from "@/components/phone/apps";
import { updateStored } from "@/components/phone/store";

describe("Reference adjustment preservation", () => {
  beforeEach(() => localStorage.clear());
  it("keeps saved app identities, order and custom labels", () => {
    const saved = DEFAULT_APPS.map((app) => app.id === "kkt" ? { ...app, name: "My saved KKT", icon: "saved-icon" } : app).reverse();
    localStorage.setItem("phone-apps-v2", JSON.stringify(saved));
    localStorage.setItem("phone-apps-removed-v1", "true");
    localStorage.setItem("phone-calendar-added-v1", "true");
    expect(loadApps()).toEqual(saved);
    expect(PASSCODE).toBe("0321");
  });
  it("changes notification preferences without replacing edited chats or posts", () => {
    const chat = '[{"id":"edited","ko":"내 수정","zh":"我的修改","en":"My edit"}]';
    const post = '[{"id":"saved","caption":"My saved caption","comments":[{"text":"My comment"}]}]';
    localStorage.setItem("kkt-msgs-v1", chat);
    localStorage.setItem("ig-posts-v1", post);
    updateStored("phone-live-settings-v1", { enabled: true, preview: true }, (current) => ({ ...current, preview: false }));
    expect(localStorage.getItem("kkt-msgs-v1")).toBe(chat);
    expect(localStorage.getItem("ig-posts-v1")).toBe(post);
    expect(JSON.parse(localStorage.getItem("phone-live-settings-v1") ?? "{}").preview).toBe(false);
  });
});