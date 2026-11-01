import { useEffect, useRef, useState } from "react";
import { authoredValue, SHARED_KEYS } from "./shared-policy";
import { queueSharedSave, sharedRead, sharedWrite } from "./shared-state";

const DB_NAME = "phone-photos-db";
const KV_STORE = "kv";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("images")) db.createObjectStore("images");
      if (!db.objectStoreNames.contains(KV_STORE)) db.createObjectStore(KV_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readDb(key: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(KV_STORE).objectStore(KV_STORE).get(`kkt:${key}`);
    request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : null);
    request.onerror = () => reject(request.error);
  });
}

async function writeDb(key: string, value: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KV_STORE, "readwrite");
    tx.objectStore(KV_STORE).put(value, `kkt:${key}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/**
 * KKT authored records are stored in IndexedDB, not localStorage.
 * Existing localStorage values are read and copied forward without deleting
 * or rewriting the originals, so this migration is non-destructive.
 */
export function usePersistKkt<T>(
  key: string,
  fallback: T,
  normalize?: (value: T) => T,
): [T, (value: T | ((current: T) => T)) => boolean, boolean] {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  const currentRef = useRef<T>(fallback);
  const hydratedRef = useRef(false);
  const normalizeValue = (v: T) => normalize ? normalize(v) : v;
  const apply = (next: T) => {
    currentRef.current = next;
    setValue(next);
  };

  useEffect(() => {
    let live = true;
    const hydrate = async () => {
      try {
        const shared = sharedRead(key);
        if (shared.found) {
          if (live) { hydratedRef.current = true; setReady(true); apply(normalizeValue(shared.value as T)); }
          return;
        }
        const stored = await readDb(key);
        if (!live) return;
        if (stored !== null) {
          hydratedRef.current = true;
          setReady(true);
          apply(normalizeValue(JSON.parse(stored) as T));
          return;
        }
        // One-time, non-destructive migration from the previous browser store.
        const legacy = localStorage.getItem(key);
        if (legacy !== null) {
          const parsed = normalizeValue(JSON.parse(legacy) as T);
          await writeDb(key, JSON.stringify(parsed));
          if (live) { hydratedRef.current = true; setReady(true); apply(parsed); }
          return;
        }
        if (live) { hydratedRef.current = true; setReady(true); apply(fallback); }
      } catch {
        // Keep the in-memory/bundled value visible; never replace saved data with defaults.
        if (live && !hydratedRef.current) { hydratedRef.current = true; setReady(true); }
      }
    };
    void hydrate();
    const reload = () => { void hydrate(); };
    const onStore = (event: Event) => {
      if ((event as CustomEvent<string>).detail === key) reload();
    };
    window.addEventListener("phone-shared-refresh", reload);
    window.addEventListener("phone-store", onStore);
    return () => {
      live = false;
      window.removeEventListener("phone-shared-refresh", reload);
      window.removeEventListener("phone-store", onStore);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = (nextValue: T | ((current: T) => T)): boolean => {
    try {
      const previous = currentRef.current;
      const next = typeof nextValue === "function"
        ? (nextValue as (current: T) => T)(previous)
        : nextValue;
      if (JSON.stringify(previous) === JSON.stringify(next)) return true;
      apply(next);
      if (sharedWrite(key, next)) return true;
      const before = JSON.stringify(authoredValue(previous));
      const after = JSON.stringify(authoredValue(next));
      void writeDb(key, JSON.stringify(next)).then(() => {
        window.dispatchEvent(new CustomEvent("phone-store", { detail: key }));
      }).catch(() => {
        alert("KKT could not save on this device. Your current screen is unchanged; please keep this page open and retry.");
      });
      if (SHARED_KEYS.has(key) && before !== after) queueSharedSave(key, next);
      return true;
    } catch {
      return false;
    }
  };

  return [normalizeValue(value), set, ready];
}
