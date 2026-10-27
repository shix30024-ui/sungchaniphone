import { useEffect, useState } from "react";

/** Persisted state in localStorage. Loads after mount so SSR markup matches. */
export function backupPhoneData() {
  try {
    if (localStorage.getItem("phone-backup-before-completion-v1")) return;
    const backup: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && /^(phone-|kkt-|ig-|x-|photos-|notes-|calendar-|music-)/.test(key)) {
        const value = localStorage.getItem(key);
        if (value !== null) backup[key] = value;
      }
    }
    localStorage.setItem("phone-backup-before-completion-v1", JSON.stringify(backup));
  } catch { /* Never stop loading existing data if backup space is unavailable. */ }
}

export function usePersist<T>(key: string, def: T, normalize?: (value: T) => T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(def);
  useEffect(() => {
    try {
      const s = localStorage.getItem(key);
      if (s) {
        backupPhoneData();
        const loaded = JSON.parse(s) as T;
        setVal(normalize ? normalize(loaded) : loaded);
      }
    } catch {}
    // Pick up changes written elsewhere (live messages, other tabs) without resetting anything.
    const reload = () => {
      try {
        const s = localStorage.getItem(key);
        if (s) { const loaded = JSON.parse(s) as T; setVal(normalize ? normalize(loaded) : loaded); }
      } catch {}
    };
    const onStore = (e: Event) => { if ((e as CustomEvent<string>).detail === key) reload(); };
    const onStorage = (e: StorageEvent) => { if (e.key === key) reload(); };
    window.addEventListener("phone-store", onStore);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener("phone-store", onStore); window.removeEventListener("storage", onStorage); };
  }, [key]);
  const set = (v: T) => {
    try {
      backupPhoneData();
      localStorage.setItem(key, JSON.stringify(v));
      setVal(v);
      window.dispatchEvent(new CustomEvent("phone-store", { detail: key }));
    } catch {
      alert("Storage full — try a smaller image. / 저장 공간이 부족합니다 / 存储空间不足");
    }
  };
  return [normalize ? normalize(val) : val, set];
}

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Read an image file and shrink it so it fits in localStorage. */
export function fileToDataUrl(file: File, max = 900): Promise<string> {
  return new Promise((res, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("Could not read image"));
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = img.width * s;
        c.height = img.height * s;
        const context = c.getContext("2d");
        if (!context) { reject(new Error("Could not resize image")); return; }
        context.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => reject(new Error("Invalid image"));
      img.src = String(r.result);
    };
    r.readAsDataURL(file);
  });
}
