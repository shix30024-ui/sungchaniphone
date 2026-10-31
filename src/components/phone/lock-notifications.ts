import type { Msg } from "./story";

/** No Anton lock-screen previews: this story beat is delivered inside KakaoTalk only. */
export const ANTON_LOCK_NOTIFICATIONS: Msg[] = [];

export function lockNotifications(existing: Msg[]): Msg[] {
  return existing;
}

/** Lock-screen notices are intentionally disabled. */
export function withLockNotices(thread: Msg[]): Msg[] {
  return thread;
}
