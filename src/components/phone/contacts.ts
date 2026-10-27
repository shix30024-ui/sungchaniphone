import { CONTACTS, type Contact } from "./story";
export const DEVICE_CONTACTS_KEY = "phone-device-contacts-v1";
export const RECENTS_KEY = "phone-call-recents-v1";
export type DeviceContact = Contact & { number?: string | undefined; email?: string | undefined; hidden?: boolean | undefined };
export type RecentCall = { id: string; contactId: string; name: string; time: string; direction?: "outgoing" | "incoming" | "missed" | undefined };
export function mergeDeviceContacts(legacy: Contact[], edits: DeviceContact[]): DeviceContact[] {
  const overrides = new Map(edits.map((c) => [c.id, c]));
  const combined: DeviceContact[] = [...legacy.map((c) => overrides.get(c.id) ?? c), ...edits.filter((c) => !legacy.some((old) => old.id === c.id))];
  return combined.filter((c) => !c.hidden);
}
export const DEFAULT_DEVICE_CONTACTS = CONTACTS;
