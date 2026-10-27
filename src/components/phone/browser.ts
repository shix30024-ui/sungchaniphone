export type BrowserPage = { id: string; title: string; url: string; body: string };
export type BrowserVisit = { id: string; title: string; url: string; at: string };
export const BROWSER_PAGES_KEY = "phone-browser-pages-v1";
export const BROWSER_HISTORY_KEY = "phone-browser-history-v1";
export function safeBrowserUrl(value: string): string | null {
  try {
    const trimmed = value.trim();
    if (!trimmed || /^(javascript|data|file|vbscript):/i.test(trimmed)) return null;
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch { return null; }
}
export function browserDestination(value: string): string | null {
  if (!value.trim()) return null;
  return /\s/.test(value.trim()) || !value.includes(".") ? `https://www.google.com/search?q=${encodeURIComponent(value.trim())}` : safeBrowserUrl(value);
}
