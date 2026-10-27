import { describe, expect, it } from "vitest";
import { label, type Label } from "@/components/phone/labels";

describe("Live-update label safety", () => {
  it("does not throw when a stale app requests a removed dictionary entry", () => {
    for (const language of ["en", "ko", "zh"] as const) {
      expect(() => label(language, "removed-entry" as Label)).not.toThrow();
    }
  });
});