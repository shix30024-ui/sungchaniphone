export const STORY_DATE = "2026-10-26";
export const STORY_NOW = "2026-10-26T20:26:00";

export function sortMessages<T extends { date: string; time: string; order: number }>(messages: T[]): T[] {
  return [...messages].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.order - b.order);
}

export const messageText = (message: { ko: string; zh: string }, language: "ko" | "zh") =>
  language === "ko" ? message.ko : message.zh || "暂无翻译";