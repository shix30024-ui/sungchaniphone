import { useEffect, useState } from "react";
import { resolveImg } from "./ui";

/** Large photo uploads live in IndexedDB; photos-v1 only keeps a small "idb:<id>" reference. */
const DB = "phone-photos-db", STORE = "images";
const cache = new Map<string, string>();

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function putPhotoImage(dataUrl: string): Promise<string> {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const db = await open();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataUrl, id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  cache.set(id, dataUrl);
  return `idb:${id}`;
}

async function getPhotoImage(id: string): Promise<string> {
  if (cache.has(id)) return cache.get(id)!;
  const db = await open();
  return new Promise((res) => {
    const r = db.transaction(STORE).objectStore(STORE).get(id);
    r.onsuccess = () => { const v = String(r.result ?? ""); cache.set(id, v); res(v); };
    r.onerror = () => res("");
  });
}

/** Resolves img:, idb: and data URLs to a displayable src. */
export function usePhotoSrc(s?: string) {
  const isDb = !!s?.startsWith("idb:");
  const [src, setSrc] = useState(() => (isDb ? cache.get(s!.slice(4)) ?? "" : resolveImg(s)));
  useEffect(() => {
    if (!s?.startsWith("idb:")) { setSrc(resolveImg(s)); return; }
    let live = true;
    void getPhotoImage(s.slice(4)).then((v) => { if (live) setSrc(v); });
    return () => { live = false; };
  }, [s]);
  return src;
}

export function PhotoImg({ src, ...rest }: Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & { src?: string | undefined }) {
  const url = usePhotoSrc(src);
  return url ? <img src={url} {...rest} /> : <span className={`block bg-muted ${rest.className ?? ""}`} />;
}
