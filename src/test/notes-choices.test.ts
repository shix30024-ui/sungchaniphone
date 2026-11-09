import { describe, it, expect } from "vitest";
import { NOTES } from "@/components/phone/story";
import { noteContent } from "@/components/phone/note-language";
describe("new notes translations", () => {
  const ids = ["n7-1","n7-2","n7-3","n7-4","n7-5","n7-6","n7-7","n7-8"];
  for (const id of ids) it(`${id} has ko/en/zh`, () => {
    const n = NOTES.find((x: any) => x.id === id) as any;
    expect(n).toBeTruthy();
    for (const l of ["ko","en","zh"] as const) {
      const c = noteContent(n, l);
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.body.length).toBeGreaterThan(0);
    }
    expect(noteContent(n, "en").body).not.toBe(noteContent(n, "zh").body);
  });
});
