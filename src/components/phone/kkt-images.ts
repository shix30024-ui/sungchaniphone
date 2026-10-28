import type { Msg } from "./story";
import { putPhotoImage } from "./photo-db";

const KEY = "kkt-msgs-v1";
let running = false;

/** Moves data-URL chat images into IndexedDB, replacing only the image field with an idb: reference. */
export async function moveKktImagesToDb() {
  if (running || typeof localStorage === "undefined") return;
  running = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const list = JSON.parse(raw) as Msg[];
    const moved = new Map<string, string>();
    for (const m of list) {
      if (m.image?.startsWith("data:") && !moved.has(m.image)) moved.set(m.image, await putPhotoImage(m.image));
    }
    if (!moved.size) return;
    // Re-read so edits made meanwhile are kept; only swap image strings.
    const latest = JSON.parse(localStorage.getItem(KEY) ?? "[]") as Msg[];
    localStorage.setItem(KEY, JSON.stringify(latest.map((m) => (m.image && moved.has(m.image) ? { ...m, image: moved.get(m.image)! } : m))));
    window.dispatchEvent(new CustomEvent("phone-store", { detail: KEY }));
  } catch { /* leave data exactly as it was */ } finally { running = false; }
}
