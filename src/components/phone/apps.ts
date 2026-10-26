export type App = {
  id: string;
  name: string;
  icon: string;
  color: string;
  url: string;
  dock: boolean;
};

export const PASSCODE = "0321";

export const DEFAULT_APPS: App[] = [
  { id: "ig", name: "Instagram", icon: "📷", color: "linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)", url: "https://instagram.com", dock: false },
  { id: "kkt", name: "KakaoTalk", icon: "💬", color: "#fee500", url: "", dock: false },
  { id: "x", name: "X", icon: "𝕏", color: "#000000", url: "https://x.com", dock: false },
  { id: "yt", name: "YouTube", icon: "▶", color: "#ff0033", url: "https://youtube.com", dock: false },
  { id: "wv", name: "Weverse", icon: "W", color: "linear-gradient(135deg,#16e0c4,#3b82f6)", url: "https://weverse.io", dock: false },
  { id: "photos", name: "Photos", icon: "🌼", color: "#ffffff", url: "", dock: false },
  { id: "cam", name: "Camera", icon: "📸", color: "#8e8e93", url: "", dock: false },
  { id: "notes", name: "Notes", icon: "📝", color: "#ffd60a", url: "", dock: false },
  { id: "spotify", name: "Spotify", icon: "♫", color: "#1db954", url: "https://spotify.com", dock: false },
  { id: "tiktok", name: "TikTok", icon: "♪", color: "#111111", url: "https://tiktok.com", dock: false },
  { id: "phone", name: "Phone", icon: "📞", color: "#34c759", url: "", dock: true },
  { id: "msg", name: "Messages", icon: "💭", color: "#30d158", url: "", dock: true },
  { id: "safari", name: "Safari", icon: "🧭", color: "#ffffff", url: "https://google.com", dock: true },
  { id: "music", name: "Music", icon: "🎵", color: "linear-gradient(135deg,#fc5c7d,#fa233b)", url: "", dock: true },
];

const KEY = "phone-apps-v1";
export const loadApps = (): App[] => {
  try {
    const s = localStorage.getItem(KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return DEFAULT_APPS;
};
export const saveApps = (a: App[]) => localStorage.setItem(KEY, JSON.stringify(a));
