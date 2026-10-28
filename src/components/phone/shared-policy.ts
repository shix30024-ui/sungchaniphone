export const SHARED_KEYS = new Set([
  "phone-apps-v2", "kkt-contacts-v1", "kkt-msgs-v1", "phone-kkt-gifts-v1",
  "ig-profile-v1", "ig-friend-accounts-v1", "ig-posts-v1", "ig-friend-posts-v1",
  "ig-stories-v1", "ig-friend-stories-v1", "x-tweets-v1", "photos-v1",
  "notes-v1", "phone-note-folders-v1", "calendar-events-v1", "music-library-v1",
  "phone-device-contacts-v1", "phone-browser-pages-v1", "phone-sms-threads-v1",
  "phone-sms-messages-v1", "phone-call-recents-v1",
]);

/** Explicitly player-originated records and device-only flags never become the shared story. */
export function authoredValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.filter((v) => !v || typeof v !== "object" || (v as Record<string, unknown>)["source"] !== "player").map(authoredValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([key]) => !["liked", "saved", "read", "unread", "seen"].includes(key)).map(([k, v]) => [k, authoredValue(v)]));
  return value;
}

export function validateSharedPatch(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid content");
  const patch = input as Record<string, unknown>;
  if (Object.keys(patch).some((key) => !SHARED_KEYS.has(key))) throw new Error("Private device data cannot be shared");
  if (JSON.stringify(patch).length > 12_000_000) throw new Error("Content too large");
  return Object.fromEntries(Object.entries(patch).map(([key, value]) => [key, authoredValue(value)]));
}