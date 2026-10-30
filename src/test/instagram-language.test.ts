import { describe, expect, it } from "vitest";
import { POSTS } from "@/components/phone/story";
import { FRIEND_POSTS } from "@/components/phone/social";
import { instagramCaption, editInstagramCaption } from "@/components/phone/instagram-language";

describe("Instagram system language without original changes", () => {
  it("translates unchanged captions for owner and friend posts", () => {
    for (const post of [...POSTS, ...FRIEND_POSTS]) {
      expect(instagramCaption(post, "ko")).toBe(post.caption);
      expect(instagramCaption(post, "zh")).not.toBe(post.caption);
      expect(instagramCaption(post, "en")).not.toBe(post.caption);
    }
    expect(instagramCaption(POSTS[0], "zh")).toBe("最后一个秋季学期 🍂");
  });
  it("preserves manual originals, images and comments and edits only the current language", () => {
    const post = { ...POSTS[0], caption: "我自己改的帖子" };
    const before = JSON.stringify(post);
    expect(instagramCaption(post, "en")).toBe("我自己改的帖子");
    const edited = editInstagramCaption(post, "en", "My own post");
    expect(instagramCaption(edited, "en")).toBe("My own post");
    expect(instagramCaption(edited, "zh")).toBe("我自己改的帖子");
    expect(edited.caption).toBe(post.caption);
    expect(edited.comments).toBe(post.comments);
    expect(JSON.stringify(post)).toBe(before);
    expect(instagramCaption(editInstagramCaption(post, "zh", ""), "zh")).toBe("");
  });
});