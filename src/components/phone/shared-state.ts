import { SHARED_KEYS } from "./shared-policy";

// Browser-only composed view. Never replace the legacy local records on remote read.
let active = false;
let owner = false;
let revision = 0;
let shared: Record<string, unknown> = {};
const overlays = new Map<string, unknown>();
let onSave: ((key: string, value: unknown) => void) | undefined;
export const isSharedOwner = () => owner;
export const sharedRevision = () => revision;
export function setSharedOwner(value: boolean) { owner = value; }
export function setSharedSave(handler: typeof onSave) { onSave = handler; }
export function installShared(payload: Record<string, unknown>, version: number) {
  shared = payload; revision = version; active = true; overlays.clear();
  window.dispatchEvent(new Event("phone-shared-refresh"));
}
export function sharedRead(key: string): { found: boolean; value?: unknown } {
  if (!active || owner || !SHARED_KEYS.has(key)) return { found: false };
  if (overlays.has(key)) return { found: true, value: overlays.get(key) };
  return key in shared ? { found: true, value: shared[key] } : { found: false };
}
export function sharedWrite(key: string, value: unknown): boolean {
  if (!active || owner || !SHARED_KEYS.has(key)) return false;
  overlays.set(key, value);
  window.dispatchEvent(new CustomEvent("phone-store", { detail: key }));
  return true;
}
export function queueSharedSave(key: string, value: unknown) {
  if (owner && SHARED_KEYS.has(key)) onSave?.(key, value);
}