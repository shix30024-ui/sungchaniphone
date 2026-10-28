import { useEffect, useState } from "react";
import { resolveImg } from "./ui";

/** Large photo uploads live in IndexedDB; photos-v1 only keeps a small "idb:<id>" reference. */
const DB = "phone-photos-db", STORE = "images", KV = "kv";
const cache = new Map<string, string>();

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 2);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV);
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function putPhotoImage(dataUrl: string): Promise<string> {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  await putPhotoImageWithId(id, dataUrl);
  return `idb:${id}`;
}

/** Store under a known id so an imported bundle keeps its existing "idb:" references valid. */
export async function putPhotoImageWithId(id: string, dataUrl: string): Promise<void> {
  const db = await open();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataUrl, id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  cache.set(id, dataUrl);
}

/** Every stored image, keyed by id, for bundling into a downloadable file. */
export async function listPhotoImages(): Promise<Record<string, string>> {
  const db = await open();
  return new Promise((res) => {
    const out: Record<string, string> = {};
    const store = db.transaction(STORE).objectStore(STORE);
    const req = store.openCursor();
    req.onsuccess = () => {
      const cur = req.result;
      if (cur) { out[String(cur.key)] = String(cur.value ?? ""); cur.continue(); } else res(out);
    };
    req.onerror = () => res(out);
  });
}

/** Small key/value side store (import safety copies) that never touches localStorage quota. */
export async function putKv(id: string, value: string): Promise<void> {
  const db = await open();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(KV, "readwrite");
    tx.objectStore(KV).put(value, id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export async function getKv(id: string): Promise<string | null> {
  const db = await open();
  return new Promise((res) => {
    const r = db.transaction(KV).objectStore(KV).get(id);
    r.onsuccess = () => { const v = r.result; res(v === undefined || v === null ? null : String(v)); };
    r.onerror = () => res(null);
  });
}

async function getPhotoImage(id: string): Promise<string> {
  const cached = cache.get(id);
  if (cached !== undefined) return cached;
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
  const [src, setSrc] = useState(() => (isDb && s ? cache.get(s.slice(4)) ?? "" : resolveImg(s)));
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
