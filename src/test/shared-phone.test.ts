import { beforeEach, describe, expect, it, vi } from "vitest";
import { authoredValue, validateSharedPatch } from "@/components/phone/shared-policy";
import { installShared, setSharedOwner, sharedRead, sharedWrite, setSharedSave, queueSharedSave } from "@/components/phone/shared-state";
import { readOwner, unlockOwner } from "@/components/phone/owner";

describe("Shared fictional phone content", () => {
  beforeEach(() => { localStorage.clear(); setSharedOwner(false); installShared({}, 1); });
  it("lets a new visitor read the owner's changed chats and posts without importing", () => {
    installShared({ "kkt-msgs-v1": [{ id: "edited", zh: "我改好的消息", order: 7, time: "20:26" }], "ig-posts-v1": [{ id: "post", caption: "我改好的帖子" }] }, 2);
    expect(sharedRead("kkt-msgs-v1").value).toEqual([{ id: "edited", zh: "我改好的消息", order: 7, time: "20:26" }]);
    expect(sharedRead("ig-posts-v1").value).toEqual([{ id: "post", caption: "我改好的帖子" }]);
    expect(localStorage.getItem("kkt-msgs-v1")).toBeNull();
  });
  it("does not overwrite original browser edits when reading shared content", () => {
    localStorage.setItem("kkt-msgs-v1", '[{"id":"original"}]');
    installShared({ "kkt-msgs-v1": [{ id: "shared" }] }, 2);
    expect(localStorage.getItem("kkt-msgs-v1")).toBe('[{"id":"original"}]');
    setSharedOwner(true);
    expect(sharedRead("kkt-msgs-v1").found).toBe(false);
  });
  it("keeps visitor interactions separate and never sends a shared save", () => {
    const save = vi.fn(); setSharedSave(save);
    installShared({ "ig-posts-v1": [{ id: "post" }] }, 2);
    expect(sharedWrite("ig-posts-v1", [{ id: "post", liked: true }])).toBe(true);
    queueSharedSave("ig-posts-v1", []);
    expect(save).not.toHaveBeenCalled();
    expect(localStorage.getItem("ig-posts-v1")).toBeNull();
  });
  it("cannot enable editing with the public 0321 code alone", () => {
    unlockOwner("0321"); expect(readOwner()).toBe(false);
    setSharedOwner(true); expect(readOwner()).toBe(true);
  });
  it("excludes Anton progress, owner flags, AI jobs and auth data from public saves", () => {
    for (const key of ["kkt-anton-fixed-progress-v1", "phone-owner-v1", "phone-reply-queue-v1", "sb-auth-token"]) expect(() => validateSharedPatch({ [key]: {} })).toThrow();
  });
  it("keeps fixed messages verbatim and removes explicit player-originated records", () => {
    expect(authoredValue([{ id: "fixed", sender: "me", zh: "原文", order: 2, time: "10:26" }, { id: "player", source: "player", text: "临时回复" }])).toEqual([{ id: "fixed", sender: "me", zh: "原文", order: 2, time: "10:26" }]);
  });
});