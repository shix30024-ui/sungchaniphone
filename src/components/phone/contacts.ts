import { CONTACTS, type Contact } from "./story";
export const DEVICE_CONTACTS_KEY = "phone-device-contacts-v1";
export const RECENTS_KEY = "phone-call-recents-v1";
export type DeviceContact = Contact & { number?: string | undefined; email?: string | undefined; hidden?: boolean | undefined };
export type RecentCall = { id: string; contactId: string; name: string; time: string; direction?: "outgoing" | "incoming" | "missed" | undefined; duration?: number; outcome?: "connected" | "cancelled" | "missed"; simulated?: boolean };
export type CallResult = { direction: "outgoing" | "incoming" | "missed"; duration: number; outcome: "connected" | "cancelled" | "missed" };
export function callResult(incoming: boolean, connected: boolean, duration: number): CallResult {
  return { direction: incoming ? connected ? "incoming" : "missed" : "outgoing", duration: connected ? duration : 0, outcome: connected ? "connected" : incoming ? "missed" : "cancelled" };
}
export function orderCalls(calls: RecentCall[]) { return [...calls].sort((a, b) => b.time.localeCompare(a.time)); }
export function mergeDeviceContacts(legacy: Contact[], edits: DeviceContact[]): DeviceContact[] {
  const overrides = new Map(edits.map((c) => [c.id, c]));
  const combined: DeviceContact[] = [...legacy.map((c) => overrides.get(c.id) ?? c), ...edits.filter((c) => !legacy.some((old) => old.id === c.id))];
  return combined.filter((c) => !c.hidden);
}
export const DEFAULT_DEVICE_CONTACTS = CONTACTS;
