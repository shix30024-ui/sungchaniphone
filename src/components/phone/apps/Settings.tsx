import { useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Check, Globe, Bell, LayoutGrid, LockKeyhole, Info, Search, Plane, Wifi, Bluetooth, Settings as Gear } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LANGS, t, tr, type Lang } from "../i18n";
import { type LiveSettings } from "../live";
import { type App, PASSCODE } from "../apps";
import { STORY_DATE } from "../chronology";
import { usePersist } from "../store";
import { SYSTEM_KEY, DEFAULT_SYSTEM_SETTINGS, type SystemSettings } from "../system";
import { lockOwner, unlockOwner, useOwner } from "../owner";
import { exportPhoneData, importPhoneDataFile, inspectRecovery, readBackup, restoreFromBackup, undoLastImport, useImportSafety } from "../recovery";
import { SharedControls } from "../shared";

type Page = "main" | "language" | "notifications" | "about" | "general" | "owner";
export default function Settings({ lang, setLang, live, setLive, apps, onHome, onLock, onEditApps }: {
  lang: Lang; setLang: (lang: Lang) => void; live: LiveSettings; setLive: (live: LiveSettings) => void;
  apps: App[]; onHome: () => void; onLock: () => void; onEditApps: () => void;
}) {
  const [page, setPage] = useState<Page>("main");
  const [search, setSearch] = useState("");
  const [system, setSystem] = usePersist<SystemSettings>(SYSTEM_KEY, DEFAULT_SYSTEM_SETTINGS);
  const owner = useOwner();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState("");
  const hasSafety = useImportSafety();
  const onImport = async (f: File) => {
    const r = await importPhoneDataFile(f);
    setImportMsg(r
      ? L(`${r.keys} records and ${r.images} photos imported`, `기록 ${r.keys}개 · 사진 ${r.images}개 가져옴`, `已导入 ${r.keys} 条记录和 ${r.images} 张照片`)
      : L("Could not read that file", "파일을 읽을 수 없습니다", "无法读取该文件"));
  };
  const onUndo = async () => {
    const ok = await undoLastImport();
    setImportMsg(ok
      ? L("Back to the data before the last import", "마지막 가져오기 이전 데이터로 되돌림", "已回到上次导入之前的数据")
      : L("Nothing to undo", "되돌릴 항목 없음", "没有可撤销的内容"));
  };
  const L = (en: string, ko: string, zh: string) => tr(lang, { en, ko, zh });
  const title = page === "language" ? L("Language & Region", "언어 및 지역", "语言与地区") : page === "notifications" ? L("Notifications", "알림", "通知") : page === "about" ? L("About", "정보", "关于本机") : page === "general" ? L("General", "일반", "通用") : t(lang, "settings");
  const row = (name: string, icon: ReactNode, action: () => void, value?: string) => (
    <Button variant="ghost" className="settings-row" onClick={action} key={name}>
      <span className="settings-row-icon">{icon}</span><span className="settings-row-name">{name}</span>
      {value && <span className="settings-row-value">{value}</span>}<ChevronRight size={16} />
    </Button>
  );
  const items = [
    { name: L("General", "일반", "通用"), icon: <Gear />, action: () => setPage("general") },
    { name: L("Language & Region", "언어 및 지역", "语言与地区"), icon: <Globe />, action: () => setPage("language"), value: LANGS.find((l) => l.id === lang)?.label },
    { name: L("Notifications", "알림", "通知"), icon: <Bell />, action: () => setPage("notifications") },
    { name: L("Home Screen", "홈 화면", "主屏幕"), icon: <LayoutGrid />, action: onEditApps, ownerOnly: true },
    { name: L("About", "정보", "关于本机"), icon: <Info />, action: () => setPage("about") },
    { name: L("Editing", "편집", "编辑权限"), icon: <LockKeyhole />, action: () => { setPage("owner"); setCode(""); setCodeError(false); }, value: owner ? L("On", "켜짐", "已开启") : L("Off", "꺼짐", "已关闭") },
  ].filter((item) => !item.ownerOnly || owner);
  return <div className="app-page settings-page">
    <div className="settings-navigation"><Button variant="ghost" className="settings-back" onClick={page === "main" ? onHome : () => setPage("main")}><ChevronLeft />{page === "main" ? t(lang, "back") : t(lang, "settings")}</Button>{page !== "main" && <b>{title}</b>}<span /></div>
    <div className="settings-scroll">
      {page === "main" ? <>
        <h1 className="settings-title">{title}</h1>
        <label className="settings-search"><Search size={18} /><input placeholder={L("Search", "검색", "搜索")} aria-label={L("Search settings", "설정 검색", "搜索设置")} value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        {!search && <div className="settings-group">{([
          { key: "airplane", name: L("Airplane Mode", "에어플레인 모드", "飞行模式"), icon: <Plane /> },
          { key: "wifi", name: "Wi-Fi", icon: <Wifi /> },
          { key: "bluetooth", name: L("Bluetooth", "Bluetooth", "蓝牙"), icon: <Bluetooth /> },
        ] as const).map((item) => <label className="settings-row" key={item.key}><span className="settings-row-icon">{item.icon}</span><span className="settings-row-name">{item.name}</span><Switch className="settings-switch" aria-label={item.name} checked={system[item.key]} onCheckedChange={(value) => setSystem((current) => ({ ...current, [item.key]: value }))} /></label>)}</div>}
        <div className="settings-group">{items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())).map((item) => row(item.name, item.icon, item.action, item.value))}</div>
        {!search && <div className="settings-group">{row(t(lang, "lock"), <LockKeyhole />, onLock)}</div>}
      </> : page === "general" ? <div className="settings-group">{row(L("About", "정보", "关于本机"), <Info />, () => setPage("about"))}{row(L("Language & Region", "언어 및 지역", "语言与地区"), <Globe />, () => setPage("language"), LANGS.find((l) => l.id === lang)?.label)}</div> : page === "language" ? <>
        <div className="settings-section-title">{t(lang, "language")}</div>
        <div className="settings-group">{LANGS.map((l) => <Button variant="ghost" key={l.id} className="settings-row" onClick={() => setLang(l.id)} aria-pressed={lang === l.id}><span className="settings-row-name">{l.label}</span>{lang === l.id && <Check className="text-primary" />}</Button>)}</div>
        <div className="settings-group"><div className="settings-row"><span className="settings-row-name">{L("Region", "지역", "地区")}</span><span className="settings-row-value">{L("South Korea", "대한민국", "韩国")}</span></div></div>
      </> : page === "notifications" ? <>
        <div className="settings-section-title">KakaoTalk</div>
        <div className="settings-group">
          <label className="settings-row"><span className="settings-row-name">{L("Auto messages from Anton", "찬영 자동 메시지", "灿荣自动发消息")}</span><Switch className="settings-switch" aria-label="auto-messages" checked={live.enabled} onCheckedChange={(enabled) => setLive({ ...live, enabled })} /></label>
          <label className="settings-row"><span className="settings-row-name">{L("Show message previews", "미리보기 표시", "显示通知预览")}</span><Switch className="settings-switch" aria-label="previews" checked={live.preview} onCheckedChange={(preview) => setLive({ ...live, preview })} /></label>
        </div>
      </> : page === "owner" ? <>
        <div className="settings-section-title">{L("Editing", "편집", "编辑权限")}</div>
        <div className="settings-group">
          {owner ? <>
            <div className="settings-row"><span className="settings-row-name">{L("Editing is unlocked on this device", "이 기기에서 편집이 허용됨", "此设备已解锁编辑")}</span></div>
            <Button variant="ghost" className="settings-row text-destructive" onClick={() => { lockOwner(); setPage("main"); }}><span className="settings-row-name">{L("Lock editing", "편집 잠금", "锁定编辑")}</span></Button>
          </> : <>
            <div className="settings-row"><span className="settings-row-name">{L("Only the owner can edit this phone. Enter the owner code to unlock editing on this device.", "주인만 이 폰을 편집할 수 있습니다. 이 기기에서 편집하려면 주인 코드를 입력하세요.", "只有机主可以编辑这台手机。输入机主密码后，此设备才能编辑。")}</span></div>
            <label className="settings-row"><span className="settings-row-name">{L("Owner code", "주인 코드", "机主密码")}</span><input className="sheet-input" style={{ maxWidth: 140 }} type="password" inputMode="numeric" aria-label={L("Owner code", "주인 코드", "机主密码")} value={code} onChange={(e) => { setCode(e.target.value); setCodeError(false); }} /></label>
            {codeError && <div className="settings-row" role="alert"><span className="settings-row-name text-destructive">{L("Wrong code", "코드가 틀렸습니다", "密码错误")}</span></div>}
            <Button variant="ghost" className="settings-row" onClick={() => { if (unlockOwner(code)) setPage("main"); else setCodeError(true); }}><span className="settings-row-name text-primary">{L("Unlock editing", "편집 잠금 해제", "解锁编辑")}</span></Button>
          </>}
        </div>
        {owner && <>
          <div className="settings-section-title">{L("KKT / IG data check", "KKT / IG 데이터 확인", "KKT / IG 数据检查")}</div>
          <div className="settings-group">
            {inspectRecovery().map((r) => <div key={r.key} className="settings-row"><span className="settings-row-name">{r.key}</span><span className="settings-row-value">{L("now", "현재", "当前")} {r.current} · {L("backup", "백업", "备份")} {r.backup}{r.differs ? " ⚠" : ""}</span></div>)}
            {!readBackup() && <div className="settings-row"><span className="settings-row-name">{L("No backup on this device", "이 기기에 백업 없음", "此设备没有备份")}</span></div>}
            <Button variant="ghost" className="settings-row" onClick={() => { void exportPhoneData(); }}><span className="settings-row-name text-primary">{L("Download all data", "모든 데이터 다운로드", "下载全部数据")}</span></Button>
            <Button variant="ghost" className="settings-row" onClick={() => fileRef.current?.click()}><span className="settings-row-name text-primary">{L("Upload data file", "데이터 파일 올리기", "上传数据文件")}</span></Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" aria-label={L("Upload data file", "데이터 파일 올리기", "上传数据文件")} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void onImport(f); }} />
            {importMsg && <div className="settings-row" role="status"><span className="settings-row-name">{importMsg}</span></div>}
            {hasSafety && <Button variant="ghost" className="settings-row" onClick={() => { if (window.confirm(L("Undo the last import and go back to the data before it?", "마지막 가져오기 이전 데이터로 되돌릴까요?", "撤销上次导入，回到导入之前的数据？"))) void onUndo(); }}><span className="settings-row-name text-primary">{L("Undo last import", "마지막 가져오기 되돌리기", "撤销上次导入")}</span></Button>}
            {readBackup() && <Button variant="ghost" className="settings-row" onClick={() => { if (window.confirm(L("Restore KKT/IG from backup? Current data is copied aside first.", "백업에서 KKT/IG를 복원할까요? 현재 데이터는 먼저 따로 보관됩니다.", "从备份恢复 KKT/IG？当前数据会先另存一份。"))) { restoreFromBackup(); window.location.reload(); } }}><span className="settings-row-name text-primary">{L("Restore KKT/IG from backup", "백업에서 KKT/IG 복원", "从备份恢复 KKT/IG")}</span></Button>}
          </div>
        </>}
      </> : <>
        <div className="settings-group">
          {[ [L("Name", "이름", "名称"), "Sungchan’s iPhone"], [L("Date", "날짜", "日期"), STORY_DATE], [L("Apps", "앱", "应用"), String(apps.length)], [L("Passcode", "암호", "密码"), PASSCODE] ].map(([name, value]) => <div key={name} className="settings-row"><span className="settings-row-name">{name}</span><span className="settings-row-value">{value}</span></div>)}
        </div>
      </>}
    </div>
  </div>;
}