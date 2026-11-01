import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { sharedRead } from "./shared-state";

type KktKind = "contact" | "message";
type KktRecord = { record_type: KktKind; record_id: string; payload: Json };

async function readPreviousIndexedDb(key: string): Promise<unknown[] | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("phone-photos-db", 2);
    request.onupgradeneeded = () => {
      const currentDb = request.result;
      if (!currentDb.objectStoreNames.contains("images")) currentDb.createObjectStore("images");
      if (!currentDb.objectStoreNames.contains("kv")) currentDb.createObjectStore("kv");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    const raw = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction("kv").objectStore("kv").get(`kkt:${key}`);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (typeof raw !== "string") return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } finally {
    db.close();
  }
}

function idOf(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const id = (value as Record<string, unknown>).id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

/**
 * Cloud-first KKT persistence. Every contact/message is a separate database row,
 * so editing one message never replaces the full conversation snapshot.
 */
export function useCloudKkt<T extends { id: string }>(
  kind: KktKind,
  fallback: T[],
  normalize?: (value: T[]) => T[],
): [T[], (value: T[] | ((current: T[]) => T[])) => boolean, boolean] {
  const [value, setValue] = useState<T[]>(fallback);
  const [ready, setReady] = useState(false);
  const current = useRef<T[]>(fallback);
  const isOwner = useRef(false);
  const busy = useRef(false);
  const normalizeValue = (rows: T[]) => normalize ? normalize(rows) : rows;
  const apply = (rows: T[]) => { current.current = rows; setValue(rows); };

  useEffect(() => {
    let alive = true;
    const hydrate = async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        const [{ data: owner, error: ownerError }, { data: remote, error }] = await Promise.all([
          supabase.rpc("is_phone_owner"),
          supabase.from("phone_kkt_records").select("record_type,record_id,payload").eq("record_type", kind),
        ]);
        if (error) throw error;
        if (ownerError) throw ownerError;
        isOwner.current = owner === true;

        let rows = (remote ?? []).map((row) => row.payload as T);
        if (rows.length === 0 && isOwner.current) {
          // Migrate the existing authored data before falling back to bundled seeds.
          const key = kind === "contact" ? "kkt-contacts-v1" : "kkt-msgs-v1";
          let legacy: T[] | null = null;
          // The previous iteration moved the latest edits into IndexedDB.
          // Read that copy first; localStorage may be an older snapshot.
          try {
            const indexed = await readPreviousIndexedDb(key);
            if (indexed) legacy = indexed as T[];
          } catch { /* Continue to the other non-destructive migration sources. */ }
          if (!legacy) {
            const shared = sharedRead(key);
            if (shared.found && Array.isArray(shared.value)) legacy = shared.value as T[];
          }
          if (!legacy) {
            try {
              const raw = localStorage.getItem(key);
              if (raw) {
                const parsed: unknown = JSON.parse(raw);
                if (Array.isArray(parsed)) legacy = parsed as T[];
              }
            } catch { /* Keep fallback seeds if the old value is unreadable. */ }
          }
          rows = normalizeValue(legacy ?? fallback);
          const records: KktRecord[] = rows.flatMap((item) => {
            const id = idOf(item);
            return id ? [{ record_type: kind, record_id: id, payload: item as unknown as Json }] : [];
          });
          if (records.length) {
            const { error: migrateError } = await supabase.from("phone_kkt_records").upsert(records, { onConflict: "record_type,record_id" });
            if (migrateError) throw migrateError;
          }
        } else if (rows.length === 0) {
          rows = fallback;
        }
        if (alive) { apply(normalizeValue(rows)); setReady(true); }
      } catch (error) {
        console.error("[KKT cloud] Hydration failed:", error);
        if (alive) {
          // Never overwrite the visible screen with defaults after a failed read.
          setReady(true);
        }
      } finally {
        busy.current = false;
      }
    };
    void hydrate();
    const refresh = () => { void hydrate(); };
    window.addEventListener("phone-shared-refresh", refresh);
    return () => { alive = false; window.removeEventListener("phone-shared-refresh", refresh); };
  // The fallback and normalizer are static story definitions.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const set = (nextValue: T[] | ((current: T[]) => T[])): boolean => {
    const previous = current.current;
    const next = normalizeValue(typeof nextValue === "function" ? nextValue(previous) : nextValue);
    if (JSON.stringify(previous) === JSON.stringify(next)) return true;
    apply(next);
    if (!isOwner.current) return true;

    const before = new Map(previous.map((row) => [row.id, row]));
    const after = new Map(next.map((row) => [row.id, row]));
    const changed = [...after.values()].filter((row) => JSON.stringify(before.get(row.id)) !== JSON.stringify(row));
    const removed = [...before.keys()].filter((id) => !after.has(id));
    void (async () => {
      try {
        if (changed.length) {
          const records: KktRecord[] = changed.map((row) => ({
            record_type: kind,
            record_id: row.id,
            payload: row as unknown as Json,
          }));
          const { error } = await supabase.from("phone_kkt_records").upsert(records, { onConflict: "record_type,record_id" });
          if (error) throw error;
        }
        if (removed.length) {
          const { error } = await supabase.from("phone_kkt_records").delete().eq("record_type", kind).in("record_id", removed);
          if (error) throw error;
        }
      } catch (error) {
        console.error("[KKT cloud] Save failed:", error);
        alert("KKT cloud save failed. Your changes are still on screen; please retry before closing this page.");
      }
    })();
    return true;
  };

  return [value, set, ready];
}
