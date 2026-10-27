import { beforeEach, describe, expect, it } from "vitest";
import { appendCameraPhoto } from "@/components/phone/camera";
import { mergeDeviceContacts } from "@/components/phone/contacts";
import { noteContent, editNoteContent } from "@/components/phone/note-language";
import { NOTES, type Album, type Contact } from "@/components/phone/story";

describe("Widgets, camera, contacts and Notes language", () => {
  beforeEach(() => localStorage.clear());
  it("adds a captured photo to Camera Roll without replacing existing albums", () => {
    const albums: Album[] = [{ id: "saved", name: "My album", photos: [{ id: "old", image: "old", date: "2026-10-26", note: "keep" }] }];
    const result = appendCameraPhoto(albums, { id: "new", image: "data:image/jpeg;base64,x", date: "2026-10-28", note: "" }, "Camera Roll");
    expect(result[0]).toEqual(albums[0]);
    expect(result[1]?.photos.map((p) => p.id)).toEqual(["new"]);
  });
  it("lets device contact edits override shared names without altering legacy contacts", () => {
    const legacy: Contact[] = [{ id: "a", name: "Legacy", avatar: "", status: "", unread: 0 }];
    const merged = mergeDeviceContacts(legacy, [{ ...legacy[0]!, name: "Edited", number: "010" }]);
    expect(merged[0]?.name).toBe("Edited");
    expect(legacy[0]?.name).toBe("Legacy");
  });
  it("translates unchanged seed notes but keeps manually edited original text", () => {
    const note = NOTES[0]!;
    expect(noteContent(note, "zh").title).toBe("电影清单");
    expect(noteContent({ ...note, title: "My saved title" }, "zh").title).toBe("My saved title");
  });
  it("edits one note language without changing other languages", () => {
    const note = editNoteContent(NOTES[0]!, "en", { title: "My English title" });
    expect(noteContent(note, "en").title).toBe("My English title");
    expect(noteContent(note, "ko").title).toBe(NOTES[0]!.title);
  });
});