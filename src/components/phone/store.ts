import { useEffect, useState } from "react";

/** Persisted state in localStorage. Loads after mount so SSR markup matches. */
export function usePersist<T>(key: string, def: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(def);
  useEffect(() => {
    try {
      const s = localStorage.getItem(key);
      if (s) setVal(JSON.parse(s));
    } catch {}
  }, [key]);
  const set = (v: T) => {
    setVal(v);
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      alert("Storage full — try a smaller image. / 저장 공간이 부족합니다 / 存储空间不足");
    }
  };
  return [val, set];
}

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Read an image file and shrink it so it fits in localStorage. */
export function fileToDataUrl(file: File, max = 900): Promise<string> {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = img.width * s;
        c.height = img.height * s;
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(r.result);
    };
    r.readAsDataURL(file);
  });
}
