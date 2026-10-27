import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Check, Globe, Bell, LayoutGrid, LockKeyhole, Info, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LANGS, t, tr, type Lang } from "../i18n";
import { type LiveSettings } from "../live";
import { type App, PASSCODE } from "../apps";
import { STORY_DATE } from "../chronology";

type Page = "main" | "language" | "notifications" | "about";
export default function Settings({ lang, setLang, live, setLive, apps, onHome, onLock, onEditApps }: {
  lang: Lang; setLang: (lang: Lang) => void; live: LiveSettings; setLive: (live: LiveSettings) => void;
  apps: App[]; onHome: () => void; onLock: () => void; onEditApps: () => void;
}) {
  const [page, setPage] = useState<Page>("main");
  const [search, setSearch] = useState("");
  const L = (en: string, ko: string, zh: string) => tr(lang, { en, ko, zh });
  const title = page === "language" ? L("Language & Region", "언어 및 지역", "语言与地区") : page === "notifications" ? L("Notifications", "알림", "通知") : page === "about" ? L("About", "정보", "关于本机") : t(lang, "settings");
  const row = (name: string, icon: ReactNode, action: () => void, value?: string) => (
    <Button variant="ghost" className="settings-row" onClick={action} key={name}>
      <span className="settings-row-icon">{icon}</span><span className="settings-row-name">{name}</span>
      {value && <span className="settings-row-value">{value}</span>}<ChevronRight size={16} />
    </Button>
  );
  const items = [
    { name: L("Language & Region", "언어 및 지역", "语言与地区"), icon: <Globe />, action: () => setPage("language"), value: LANGS.find((l) => l.id === lang)?.label },
    { name: L("Notifications", "알림", "通知"), icon: <Bell />, action: () => setPage("notifications") },
    { name: L("Home Screen", "홈 화면", "主屏幕"), icon: <LayoutGrid />, action: onEditApps },
    { name: L("About", "정보", "关于本机"), icon: <Info />, action: () => setPage("about") },
  ];
  return <div className="app-page settings-page">
    <div className="settings-navigation"><Button variant="ghost" className="settings-back" onClick={page === "main" ? onHome : () => setPage("main")}><ChevronLeft />{page === "main" ? t(lang, "back") : t(lang, "settings")}</Button>{page !== "main" && <b>{title}</b>}<span /></div>
    <div className="settings-scroll">
      {page === "main" ? <>
        <h1 className="settings-title">{title}</h1>
        <label className="settings-search"><Search size={18} /><input placeholder={L("Search", "검색", "搜索")} aria-label={L("Search settings", "설정 검색", "搜索设置")} value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        <div className="settings-group">{items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())).map((item) => row(item.name, item.icon, item.action, item.value))}</div>
        {!search && <div className="settings-group">{row(t(lang, "lock"), <LockKeyhole />, onLock)}</div>}
      </> : page === "language" ? <>
        <div className="settings-section-title">{t(lang, "language")}</div>
        <div className="settings-group">{LANGS.map((l) => <Button variant="ghost" key={l.id} className="settings-row" onClick={() => setLang(l.id)} aria-pressed={lang === l.id}><span className="settings-row-name">{l.label}</span>{lang === l.id && <Check className="text-primary" />}</Button>)}</div>
        <div className="settings-group"><div className="settings-row"><span className="settings-row-name">{L("Region", "지역", "地区")}</span><span className="settings-row-value">{L("South Korea", "대한민국", "韩国")}</span></div></div>
      </> : page === "notifications" ? <>
        <div className="settings-section-title">KakaoTalk</div>
        <div className="settings-group">
          <label className="settings-row"><span className="settings-row-name">{L("Auto messages from Anton", "찬영 자동 메시지", "灿荣自动发消息")}</span><Switch className="settings-switch" aria-label="auto-messages" checked={live.enabled} onCheckedChange={(enabled) => setLive({ ...live, enabled })} /></label>
          <label className="settings-row"><span className="settings-row-name">{L("Show message previews", "미리보기 표시", "显示通知预览")}</span><Switch className="settings-switch" aria-label="previews" checked={live.preview} onCheckedChange={(preview) => setLive({ ...live, preview })} /></label>
        </div>
      </> : <>
        <div className="settings-group">
          {[ [L("Name", "이름", "名称"), "Sungchan’s iPhone"], [L("Date", "날짜", "日期"), STORY_DATE], [L("Apps", "앱", "应用"), String(apps.length)], [L("Passcode", "암호", "密码"), PASSCODE] ].map(([name, value]) => <div key={name} className="settings-row"><span className="settings-row-name">{name}</span><span className="settings-row-value">{value}</span></div>)}
        </div>
      </>}
    </div>
  </div>;
}