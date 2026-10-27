import { useEffect, useState } from "react";
import wallpaper from "@/assets/wallpaper.jpeg.asset.json";
import { type App, DEFAULT_APPS, SETTINGS_ICON, PASSCODE, loadApps, saveApps } from "./apps";
import { LANGS, type Lang, fmtDate, fmtTime, t } from "./i18n";
import Kakao from "./apps/Kakao";
import Instagram from "./apps/Instagram";
import XApp from "./apps/XApp";
import Photos from "./apps/Photos";
import Notes from "./apps/Notes";
import { STORY_NOW } from "./chronology";
import Calendar from "./apps/Calendar";
import Music from "./apps/Music";
import { backupPhoneData } from "./store";
import { label as appLabel } from "./labels";

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date(STORY_NOW));
  }, []);
  return now;
}

function StatusBar({ now, inApp }: { now: Date | null; inApp: boolean }) {
  return (
    <div className={`status-bar ${inApp ? "status-bar-app" : ""}`}>
      <span>{now ? fmtTime(now) : ""}</span>
      <span className="opacity-90">▂▄▆ ᯤ ▮</span>
    </div>
  );
}

const isImg = (i: string) => /^(\/|https?:|data:)/.test(i);
function IconFace({ icon }: { icon: string }) {
  return isImg(icon) ? <img src={icon} alt="" className="icon-img" draggable={false} /> : <span className="text-[28px] leading-none">{icon}</span>;
}

function Icon({ app, onClick, wiggle, label = true }: { app: App; onClick: () => void; wiggle: boolean; label?: boolean }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 min-w-0">
      <div className={`app-icon ${wiggle ? "wiggle" : ""}`} style={{ background: app.color }}>
        <IconFace icon={app.icon} />
      </div>
      {label && <span className="app-label truncate max-w-[72px]">{app.name}</span>}
    </button>
  );
}

function LangPicker({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="glass-pill flex p-1 gap-1">
      {LANGS.map((l) => (
        <button key={l.id} onClick={() => setLang(l.id)} className={`lang-btn ${lang === l.id ? "lang-on" : ""}`}>
          {l.label}
        </button>
      ))}
    </div>
  );
}

function Lock({ lang, setLang, now, onUnlock }: { lang: Lang; setLang: (l: Lang) => void; now: Date | null; onUnlock: () => void }) {
  const [pad, setPad] = useState(false);
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);

  const press = (d: string) => {
    if (code.length >= 4) return;
    const n = code + d;
    setCode(n);
    if (n.length === 4) {
      if (n === PASSCODE) setTimeout(onUnlock, 150);
      else {
        setErr(true);
        setTimeout(() => { setCode(""); setErr(false); }, 600);
      }
    }
  };

  if (!pad)
    return (
      <div className="absolute inset-0 flex flex-col items-center pt-20 text-on-glass" onClick={() => setPad(true)}>
        <div className="text-lg font-medium opacity-90">{now ? fmtDate(lang, now) : ""}</div>
        <div className="lock-time">{now ? fmtTime(now) : ""}</div>
        <div className="mt-auto mb-10 flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
          <LangPicker lang={lang} setLang={setLang} />
          <button onClick={() => setPad(true)} className="text-sm opacity-80 animate-pulse">{t(lang, "swipe")}</button>
        </div>
      </div>
    );

  return (
    <div className="absolute inset-0 frost flex flex-col items-center pt-24 text-on-glass">
      <div className="text-lg">{err ? t(lang, "wrong") : t(lang, "enter")}</div>
      <div className={`flex gap-5 mt-5 ${err ? "shake" : ""}`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`dot ${i < code.length ? "dot-on" : ""}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-x-6 gap-y-4 mt-14">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "x"].map((k, i) =>
          k === "" ? <span key={i} /> : k === "x" ? (
            <button key={i} onClick={() => (code ? setCode(code.slice(0, -1)) : setPad(false))} className="text-base self-center">
              {code ? t(lang, "del") : t(lang, "cancel")}
            </button>
          ) : (
            <button key={i} onClick={() => press(k)} className="key">{k}</button>
          ),
        )}
      </div>
    </div>
  );
}

function Editor({ lang, app, onSave, onRemove, onClose }: { lang: Lang; app: App; onSave: (a: App) => void; onRemove: () => void; onClose: () => void }) {
  const [a, setA] = useState(app);
  const field = (k: "name" | "icon" | "color" | "url", label: string) => (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input className="sheet-input" value={a[k]} onChange={(e) => setA({ ...a, [k]: e.target.value })} />
    </label>
  );
  const swatches = ["#000000", "#ffffff", "#fee500", "#34c759", "#0a84ff", "#ff375f", "#ff9f0a", "#8e8e93", "linear-gradient(45deg,#f9ce34,#ee2a7b,#6228d7)"];
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-foreground/30" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="text-primary">{t(lang, "cancel")}</button>
          <b>{t(lang, "editApp")}</b>
          <button onClick={() => onSave(a)} className="text-primary font-semibold">{t(lang, "save")}</button>
        </div>
        <div className="flex justify-center mb-4"><Icon app={a} onClick={() => {}} wiggle={false} /></div>
        <div className="space-y-3">
          {field("name", t(lang, "name"))}
          {field("icon", t(lang, "icon"))}
          <label className="block text-sm text-primary cursor-pointer">
            ⬆ {t(lang, "upload")}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const r = new FileReader(); r.onload = () => setA({ ...a, icon: String(r.result) }); r.readAsDataURL(f);
            }} />
          </label>
          <div>
            <span className="text-xs text-muted-foreground">{t(lang, "color")}</span>
            <div className="flex gap-2 mt-1 flex-wrap">
              {swatches.map((c) => (
                <button key={c} onClick={() => setA({ ...a, color: c })} className="swatch" style={{ background: c }} />
              ))}
            </div>
            <input className="sheet-input mt-2" value={a.color} onChange={(e) => setA({ ...a, color: e.target.value })} />
          </div>
          {field("url", t(lang, "link"))}
          <label className="flex items-center justify-between text-sm">
            {t(lang, "inDock")}
            <input type="checkbox" checked={a.dock} onChange={(e) => setA({ ...a, dock: e.target.checked })} />
          </label>
          <button onClick={onRemove} className="w-full py-2.5 rounded-xl bg-muted text-destructive font-medium">{t(lang, "remove")}</button>
        </div>
      </div>
    </div>
  );
}

function AppView({ lang, app, setLang, onClose, onLock, onReset }: { lang: Lang; app: App; setLang: (l: Lang) => void; onClose: () => void; onLock: () => void; onReset: () => void }) {
  const builtIn = app.id === "kkt" || app.id === "msg" ? <Kakao lang={lang} onHome={onClose} />
    : app.id === "ig" ? <Instagram lang={lang} onHome={onClose} />
    : app.id === "x" ? <XApp lang={lang} onHome={onClose} />
    : app.id === "photos" ? <Photos lang={lang} onHome={onClose} />
    : app.id === "notes" ? <Notes lang={lang} onHome={onClose} />
    : app.id === "calendar" ? <Calendar lang={lang} onHome={onClose} />
    : app.id === "music" ? <Music lang={lang} onHome={onClose} /> : null;
  if (builtIn) return <div className="phone-app-container app-open">{builtIn}</div>;
  const isSettings = app.id === "settings";
  return (
    <div className="absolute inset-0 z-20 bg-background text-foreground flex flex-col app-open">
      <div className="pt-12 px-4 pb-3 flex items-center gap-3 border-b">
        <button onClick={onClose} className="text-primary">‹ {t(lang, "back")}</button>
        <b className="mx-auto pr-10">{app.name}</b>
      </div>
      {isSettings ? (
        <div className="p-4 space-y-5">
          <div>
            <div className="text-xs text-muted-foreground mb-2">{t(lang, "language")}</div>
            <div className="rounded-xl bg-muted divide-y">
              {LANGS.map((l) => (
                <button key={l.id} onClick={() => setLang(l.id)} className="w-full flex justify-between px-4 py-3">
                  {l.label}{lang === l.id && <span className="text-primary">✓</span>}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onLock} className="w-full py-3 rounded-xl bg-muted">{t(lang, "lock")}</button>
          <button onClick={onReset} className="w-full py-3 rounded-xl bg-muted text-destructive">{t(lang, "reset")}</button>
        </div>
      ) : app.url ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="app-icon scale-150" style={{ background: app.color }}><IconFace icon={app.icon} /></div>
          <a href={app.url} target="_blank" rel="noreferrer" className="mt-6 px-5 py-2.5 rounded-full bg-primary text-primary-foreground">{app.name} ↗</a>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">{t(lang, "noLink")}</div>
      )}
    </div>
  );
}

export default function Phone() {
  const now = useNow();
  const [lang, setLangState] = useState<Lang>("en");
  const [locked, setLocked] = useState(true);
  const [apps, setApps] = useState<App[]>(DEFAULT_APPS);
  const [editMode, setEditMode] = useState(false);
  const [editing, setEditing] = useState<App | null>(null);
  const [open, setOpen] = useState<App | null>(null);

  useEffect(() => {
    backupPhoneData();
    setApps(loadApps());
    const l = localStorage.getItem("phone-lang") as Lang | null;
    if (l && LANGS.some((language) => language.id === l)) setLangState(l);
  }, []);
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem("phone-lang", l); };
  const update = (a: App[]) => { setApps(a); saveApps(a); };

  const settingsApp: App = { id: "settings", name: t(lang, "settings"), icon: SETTINGS_ICON, color: "#8e8e93", url: "", dock: false };
  const translatedApps = apps.map((a) => {
    const original = DEFAULT_APPS.find((item) => item.id === a.id);
    if (a.name !== original?.name) return a;
    const name = a.id === "photos" ? { en: "Photos", ko: "사진", zh: "照片" }[lang]
      : a.id === "notes" ? { en: "Notes", ko: "메모", zh: "备忘录" }[lang]
      : a.id === "calendar" || a.id === "music" ? appLabel(lang, a.id) : a.name;
    return { ...a, name };
  });
  const grid = [...translatedApps.filter((a) => !a.dock), settingsApp];
  const dock = apps.filter((a) => a.dock).slice(0, 4);

  const tap = (a: App) => {
    if (editMode && a.id !== "settings") setEditing(a);
    else if (!editMode) setOpen(a);
  };

  return (
    <div className="phone-screen" style={{ backgroundImage: `url(${wallpaper.url})` }}>
      <StatusBar now={now} inApp={Boolean(open || editing)} />
      {locked ? (
        <Lock lang={lang} setLang={setLang} now={now} onUnlock={() => setLocked(false)} />
      ) : (
        <div className="absolute inset-0 flex flex-col pt-14 home-in" aria-hidden={Boolean(open)} inert={Boolean(open)}>
          <div className="flex justify-end px-5 gap-2">
            {editMode && (
              <button className="glass-pill px-3 py-1 text-sm text-on-glass" onClick={() => {
                const n: App = { id: crypto.randomUUID(), name: t(lang, "newApp"), icon: "✦", color: "#0a84ff", url: "", dock: false };
                update([...apps, n]); setEditing(n);
              }}>+ {t(lang, "add")}</button>
            )}
            <button className="glass-pill px-3 py-1 text-sm text-on-glass" onClick={() => setEditMode(!editMode)}>
              {editMode ? t(lang, "done") : t(lang, "edit")}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-y-6 gap-x-2 px-5 mt-5">
            {grid.map((a) => <Icon key={a.id} app={a} wiggle={editMode && a.id !== "settings"} onClick={() => tap(a)} />)}
          </div>
          <div className="mt-auto mx-3 mb-3 dock">
            {dock.map((a) => <Icon key={a.id} app={a} label={false} wiggle={editMode} onClick={() => tap(a)} />)}
          </div>
          <div className="home-bar" />
        </div>
      )}
      {open && (
        <AppView lang={lang} app={open} setLang={setLang} onClose={() => setOpen(null)}
          onLock={() => { setOpen(null); setLocked(true); }}
          onReset={() => { if (confirm(appLabel(lang, "confirmDelete"))) { update(DEFAULT_APPS); setOpen(null); } }} />
      )}
      {editing && (
        <Editor key={editing.id} lang={lang} app={editing} onClose={() => setEditing(null)}
          onSave={(a) => { update(apps.map((x) => (x.id === a.id ? a : x))); setEditing(null); }}
          onRemove={() => { update(apps.filter((x) => x.id !== editing.id)); setEditing(null); }} />
      )}
    </div>
  );
}
