export const STORY_DATE = "2026-10-26";
export const STORY_NOW = "2026-10-26T20:26:00";

export function sortMessages<T extends { date: string; time: string; order: number }>(messages: T[]): T[] {
  return [...messages].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.order - b.order);
}

export const messageText = (message: { ko: string; zh: string; en?: string; originalText?: string }, language: "ko" | "zh" | "en") =>
  message.originalText ?? (message[language] || ({ ko: "번역 없음 — 편집에서 추가", zh: "暂无翻译", en: "Translation missing — add in Edit" })[language]);

export function nextMessageTime(messages: { date: string; time: string }[]) {
  const last = messages.filter((m) => m.date === STORY_DATE).map((m) => m.time).sort().at(-1) ?? "20:26";
  const [h = 20, m = 26] = last.split(":").map(Number);
  const minutes = Math.min(1439, Math.max(1226, h * 60 + m) + 1);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}