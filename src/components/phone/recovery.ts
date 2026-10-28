import { useEffect, useState } from "react";
import { getKv, listPhotoImages, putKv, putPhotoImageWithId } from "./photo-db";

/** Owner-only recovery for phone data. Never deletes; always snapshots current data before restoring. */
const BACKUP_KEY = "phone-backup-before-completion-v1";
const SCOPE = /^(kkt-|ig-)/;
const IMAGES_KEY = "__phone-images-v1";
const SAFETY_INDEX = "phone-last-import-safety";
const SAFETY_EVENT = "phone-import-safety";
const notifySafety = () => window.dispatchEvent(new Event(SAFETY_EVENT));

export type RecoveryRow = { key: string; current: number; backup: number; differs: boolean };

const count = (raw: string | null | undefined) => {
  if (!raw) return 0;
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v.length : 1; } catch { return 0; }
};

export function readBackup(): Record<string, string> | null {
  try { const raw = localStorage.getItem(BACKUP_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function inspectRecovery(): RecoveryRow[] {
  const backup = readBackup() || {};
  const keys = new Set<string>(Object.keys(backup).filter((k) => SCOPE.test(k)));
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && SCOPE.test(k)) keys.add(k); }
  return [...keys].sort().map((key) => {
    const cur = localStorage.getItem(key);
    return { key, current: count(cur), backup: count(backup[key]), differs: key in backup && backup[key] !== cur };
  });
}

/** Copy current KKT/IG data aside, then put the backup values back. Returns the safety-copy key. */
export function restoreFromBackup(): string | null {
  const backup = readBackup();
  if (!backup) return null;
  const safety: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && SCOPE.test(k)) { const v = localStorage.getItem(k); if (v !== null) safety[k] = v; }
  }
  const safetyKey = `phone-backup-before-restore-${Date.now()}`;
  localStorage.setItem(safetyKey, JSON.stringify(safety));
  for (const [k, v] of Object.entries(backup)) if (SCOPE.test(k)) localStorage.setItem(k, v);
  return safetyKey;
}

function readAllLocal(): Record<string, string> {
  const all: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) { const v = localStorage.getItem(k); if (v !== null) all[k] = v; }
  }
  return all;
}

function bundleFrom(local: Record<string, string>, images: Record<string, string>) {
  return JSON.stringify({ ...local, [IMAGES_KEY]: JSON.stringify(images) });
}

/** All saved text records plus every IndexedDB photo, as one JSON string. */
export async function buildPhoneBundle(): Promise<string> {
  return bundleFrom(readAllLocal(), await listPhotoImages());
}

export async function exportPhoneData() {
  const text = await buildPhoneBundle();
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = `phone-data-${Date.now()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Split a bundle back into text records and photo images. Returns null for anything unreadable. */
export function parsePhoneBundle(text: string): { local: Record<string, string>; images: Record<string, string> } | null {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return null; }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const images: Record<string, string> = {};
  const imagesRaw = obj[IMAGES_KEY];
  if (typeof imagesRaw === "string") {
    try {
      const p = JSON.parse(imagesRaw) as unknown;
      if (p && typeof p === "object" && !Array.isArray(p)) {
        for (const [k, v] of Object.entries(p as Record<string, unknown>)) if (typeof v === "string") images[k] = v;
      }
    } catch { /* images are optional; text records still import */ }
  }
  const local: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === IMAGES_KEY || k.startsWith("__")) continue;
    if (typeof v === "string") local[k] = v;
  }
  if (!Object.keys(local).length && !Object.keys(images).length) return null;
  return { local, images };
}

export type ImportResult = { keys: number; images: number; failed: number };

type ImportDeps = {
  writeImage: (id: string, url: string) => Promise<void>;
  snapshot: (payload: string) => Promise<void>;
  readLocal: () => Record<string, string>;
  readImages: () => Promise<Record<string, string>>;
  writeLocal: (key: string, value: string) => boolean;
  notify: (key: string) => void;
};

async function writeBundle(
  data: { local: Record<string, string>; images: Record<string, string> },
  deps: ImportDeps,
  snapshotFirst: boolean,
): Promise<ImportResult> {
  if (snapshotFirst) await deps.snapshot(bundleFrom(deps.readLocal(), await deps.readImages()));
  let images = 0;
  for (const [id, url] of Object.entries(data.images)) {
    try { await deps.writeImage(id, url); images++; } catch { /* a bad photo must not block the text records */ }
  }
  let keys = 0, failed = 0;
  for (const [k, v] of Object.entries(data.local)) {
    if (deps.writeLocal(k, v)) { keys++; deps.notify(k); } else failed++;
  }
  return { keys, images, failed };
}

const liveDeps = (): ImportDeps => ({
  writeImage: (id, url) => putPhotoImageWithId(id, url),
  snapshot: async (payload) => { await putKv(SAFETY_INDEX, payload); },
  readLocal: readAllLocal,
  readImages: listPhotoImages,
  writeLocal: (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } },
  notify: (k) => window.dispatchEvent(new CustomEvent("phone-store", { detail: k })),
});

/** Read a picked file as text; some environments lack File.text(). */
function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") return file.text();
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result ?? ""));
    r.onerror = () => rej(r.error);
    r.readAsText(file);
  });
}

/** Write an exported bundle into this browser. Current data is copied aside first. */
export async function importPhoneDataFile(file: File): Promise<ImportResult | null> {
  let text: string;
  try { text = await readFileText(file); } catch { return null; }
  const parsed = parsePhoneBundle(text);
  if (!parsed) return null;
  const r = await writeBundle(parsed, liveDeps(), true);
  notifySafety();
  return r;
}

export async function undoLastImport(): Promise<boolean> {
  const payload = await getKv(SAFETY_INDEX);
  const parsed = payload ? parsePhoneBundle(payload) : null;
  if (!parsed) return false;
  await writeBundle(parsed, liveDeps(), false);
  notifySafety();
  return true;
}

/** True when this device holds a copy of the state before the last import. */
export function useImportSafety(): boolean {
  const [has, setHas] = useState(false);
  useEffect(() => {
    let live = true;
    const check = () => { void getKv(SAFETY_INDEX).then((v) => { if (live) setHas(!!v); }); };
    check();
    window.addEventListener(SAFETY_EVENT, check);
    return () => { live = false; window.removeEventListener(SAFETY_EVENT, check); };
  }, []);
  return has;
}
