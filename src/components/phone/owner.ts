import { useSyncExternalStore } from "react";
import { readStored } from "./store";

/**
 * Owner mode: only the story owner may edit phone content. Players browsing the
 * published page never see edit controls. The owner unlocks editing once per
 * device with the owner code in Settings; the flag lives in the same
 * browser-local versioned store as every other phone record.
 */
export const OWNER_KEY = "phone-owner-v1";
export const OWNER_CODE = "1026";

type OwnerRecord = { unlocked: boolean };

export function readOwner(): boolean {
  return readStored<OwnerRecord>(OWNER_KEY, { unlocked: false }).unlocked;
}

export function unlockOwner(code: string): boolean {
  if (code.trim() !== OWNER_CODE) return false;
  localStorage.setItem(OWNER_KEY, JSON.stringify({ unlocked: true }));
  window.dispatchEvent(new CustomEvent("phone-store", { detail: OWNER_KEY }));
  return true;
}

export function lockOwner() {
  localStorage.setItem(OWNER_KEY, JSON.stringify({ unlocked: false }));
  window.dispatchEvent(new CustomEvent("phone-store", { detail: OWNER_KEY }));
}

function subscribe(onChange: () => void) {
  const handler = (e: Event) => { if ((e as CustomEvent).detail === OWNER_KEY) onChange(); };
  window.addEventListener("phone-store", handler);
  window.addEventListener("storage", handler);
  return () => { window.removeEventListener("phone-store", handler); window.removeEventListener("storage", handler); };
}

/** Reactive owner flag for gating edit UI. */
export function useOwner(): boolean {
  return useSyncExternalStore(subscribe, readOwner, () => false);
}
