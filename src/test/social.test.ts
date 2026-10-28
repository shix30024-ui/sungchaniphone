import { describe, expect, it } from "vitest";
import { socialFeed, authorPosts, dmAccount, FRIEND_POSTS, FRIEND_ACCOUNTS, SELF_ID } from "@/components/phone/social";
import type { Post } from "@/components/phone/story";

describe("fictional Instagram author identity", () => {
  it("private messages use the corresponding edited post-author identity", () => {
    const accounts = FRIEND_ACCOUNTS.map((a) => a.id === "anton" ? { ...a, avatar: "edited-anton-avatar", name: "Edited Anton" } : a);
    const before = JSON.stringify(accounts);
    expect(dmAccount(accounts, "anton")?.avatar).toBe("edited-anton-avatar");
    expect(dmAccount(accounts, "anton")?.name).toBe("Edited Anton");
    expect(dmAccount(accounts, "minjae")?.avatar).toBe(FRIEND_ACCOUNTS.find((a) => a.id === "minjae")?.avatar);
    expect(dmAccount(accounts, "missing")).toBeUndefined();
    expect(JSON.stringify(accounts)).toBe(before);
  });
  const original: Post = { id: "manual", image: "my-image", caption: "MY PL", date: "2026-10-26", likes: 42, comments: [{ id: "custom", user: "friend", text: "MY COMMENT" }] };
  it("merges multiple authors without altering legacy posts", () => {
    const before = JSON.stringify(original);
    const feed = socialFeed([original], FRIEND_POSTS);
    expect(new Set(feed.map((p) => p.authorId)).size).toBe(5);
    expect(JSON.stringify(original)).toBe(before);
    expect(feed.find((p) => p.id === "manual")?.caption).toBe("MY PL");
    expect(authorPosts(feed, SELF_ID).map((p) => p.id)).toEqual(["manual"]);
  });
  it("each friend profile resolves its own post and comments", () => {
    const feed = socialFeed([original], FRIEND_POSTS);
    for (const account of FRIEND_ACCOUNTS) {
      const posts = authorPosts(feed, account.id);
      expect(posts).toHaveLength(1);
      expect(posts[0]?.authorId).toBe(account.id);
      expect(posts[0]?.comments[0]?.id).not.toBe("custom");
    }
  });
});