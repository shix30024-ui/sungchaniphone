import { describe, expect, it, vi } from "vitest";
import { boundedSharingStep, mapSharedMedia } from "@/components/phone/shared-upload";

describe("Shared media upload safety", () => {
  it("uploads repeated photo references once and preserves original chat text and images", async () => {
    const original = { chats: [{ text: "我改好的内容", image: "idb:photo" }], posts: [{ images: ["idb:photo"] }] };
    const before = JSON.stringify(original);
    const upload = vi.fn(async () => "shared-media:photo.jpg");
    const result = await mapSharedMedia(original, upload, vi.fn());
    expect(upload).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ chats: [{ text: "我改好的内容", image: "shared-media:photo.jpg" }], posts: [{ images: ["shared-media:photo.jpg"] }] });
    expect(JSON.stringify(original)).toBe(before);
  });
  it("limits simultaneous uploads and reports completed photo counts", async () => {
    let active = 0; let maximum = 0;
    const progress = vi.fn();
    await mapSharedMedia(Array.from({ length: 8 }, (_, i) => `idb:${i}`), async (source) => {
      maximum = Math.max(maximum, ++active);
      await new Promise((resolve) => setTimeout(resolve, 2));
      active--; return source;
    }, progress);
    expect(maximum).toBe(3);
    expect(progress).toHaveBeenLastCalledWith(8, 8);
  });
  it("stops displaying endless saving when an upload never resolves", async () => {
    await expect(boundedSharingStep(new Promise(() => {}), 5)).rejects.toThrow("上传等待超时");
  });
});