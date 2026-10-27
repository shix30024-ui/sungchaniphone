import i_ig from "@/assets/icons/ig.png.asset.json";
import i_kkt from "@/assets/icons/kkt.png.asset.json";
import i_x from "@/assets/icons/x.png.asset.json";
import i_photos from "@/assets/icons/photos.png.asset.json";
import i_cam from "@/assets/icons/cam.png.asset.json";
import i_notes from "@/assets/icons/notes.png.asset.json";
import i_tiktok from "@/assets/icons/tiktok.png.asset.json";
import i_phone from "@/assets/icons/phone.png.asset.json";
import i_msg from "@/assets/icons/msg.png.asset.json";
import i_safari from "@/assets/icons/safari.png.asset.json";
import i_music from "@/assets/icons/music.png.asset.json";
import i_settings from "@/assets/icons/settings.png.asset.json";
export const SETTINGS_ICON = i_settings.url;
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
  { id: "ig", name: "Instagram", icon: i_ig.url, color: "linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)", url: "https://instagram.com", dock: false },
  { id: "kkt", name: "KakaoTalk", icon: i_kkt.url, color: "#fee500", url: "", dock: false },
  { id: "x", name: "X", icon: i_x.url, color: "#000000", url: "https://x.com", dock: false },
  { id: "photos", name: "Photos", icon: i_photos.url, color: "#ffffff", url: "", dock: false },
  { id: "cam", name: "Camera", icon: i_cam.url, color: "#8e8e93", url: "", dock: false },
  { id: "notes", name: "Notes", icon: i_notes.url, color: "#ffd60a", url: "", dock: false },
  { id: "tiktok", name: "TikTok", icon: i_tiktok.url, color: "#111111", url: "https://tiktok.com", dock: false },
  { id: "calendar", name: "Calendar", icon: "/icons/calendar.svg", color: "var(--background)", url: "", dock: false },
  { id: "phone", name: "Phone", icon: i_phone.url, color: "#34c759", url: "", dock: true },
  { id: "msg", name: "Messages", icon: i_msg.url, color: "#30d158", url: "", dock: true },
  { id: "safari", name: "Safari", icon: i_safari.url, color: "#ffffff", url: "https://google.com", dock: true },
  { id: "music", name: "Music", icon: i_music.url, color: "linear-gradient(135deg,#fc5c7d,#fa233b)", url: "", dock: true },
];

const KEY = "phone-apps-v2";
export const loadApps = (): App[] => {
  try {
    const s = localStorage.getItem(KEY);
    if (s) {
      const saved: App[] = JSON.parse(s);
      // Add the new app only once; retain every existing customization/deletion.
      if (!localStorage.getItem("phone-calendar-added-v1")) {
        const calendar = DEFAULT_APPS.find((app) => app.id === "calendar");
        localStorage.setItem("phone-calendar-added-v1", "true");
        if (calendar && !saved.some((app) => app.id === "calendar")) {
          const next = [...saved, calendar];
          saveApps(next);
          return next;
        }
      }
      return saved;
    }
  } catch {}
  return DEFAULT_APPS;
};
export const saveApps = (a: App[]) => localStorage.setItem(KEY, JSON.stringify(a));
