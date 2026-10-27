import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, Clock, Globe, LockKeyhole, Plus, Search, Share, SquarePen, Trash2, PanelsTopLeft, X } from "lucide-react";
import { type AppProps, tr } from "../i18n";
import { usePersist, uid } from "../store";
import { BROWSER_PAGES_KEY, BROWSER_HISTORY_KEY, browserDestination, safeBrowserUrl, type BrowserPage, type BrowserVisit } from "../browser";
import { EditBar, Field, TopBar } from "../ui";
import { label, confirmDelete } from "../labels";

export default function Safari({ lang, onHome }: AppProps) {
  const [pages, setPages] = usePersist<BrowserPage[]>(BROWSER_PAGES_KEY, []);
  const [history, setHistory] = usePersist<BrowserVisit[]>(BROWSER_HISTORY_KEY, []);
  const [draft, setDraft] = useState<BrowserPage | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [panel, setPanel] = useState<"favorites" | "history" | "tabs">("favorites");
  const [trail, setTrail] = useState<(string | null)[]>([null]);
  const [cursor, setCursor] = useState(0);
  const [error, setError] = useState("");
  const L = (en: string, ko: string, zh: string) => tr(lang, { en, ko, zh });
  const current = pages.find((p) => p.id === selected);
  const navigate = (page: BrowserPage) => { setSelected(page.id); setAddress(page.url); setTrail((old) => [...old.slice(0, cursor + 1), page.id]); setCursor(cursor + 1); setHistory((old) => [{ id: uid(), title: page.title, url: page.url, at: new Date().toISOString() }, ...old]); };
  const submit = () => {
    const url = browserDestination(address);
    if (!url) { setError(L("Enter a valid web address", "올바른 주소를 입력하세요", "请输入有效网址")); return; }
    const saved = pages.find((p) => safeBrowserUrl(p.url) === url);
    if (saved) { navigate(saved); return; }
    setHistory((old) => [{ id: uid(), title: address, url, at: new Date().toISOString() }, ...old]);
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const go = (direction: number) => { const next = cursor + direction; if (next < 0 || next >= trail.length) return; const id = trail[next] ?? null; setCursor(next); setSelected(id); setAddress(pages.find((p) => p.id === id)?.url ?? ""); };
  if (draft) return <div className="app-page bg-background"><TopBar title={L("Favorite", "즐겨찾기", "收藏网页")} right={pages.some((p) => p.id === draft.id) && <Button variant="ghost" size="icon" aria-label={label(lang, "delete")} onClick={() => { if (confirmDelete(lang)) { setPages((old) => old.filter((p) => p.id !== draft.id)); setSelected(null); setDraft(null); } }}><Trash2 /></Button>} /><div className="flex-1 overflow-y-auto p-4 space-y-4"><Field label={L("Title", "제목", "标题")}><input aria-label={L("Title", "제목", "标题")} className="sheet-input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field><Field label={L("Website", "웹사이트", "网址")}><input aria-label={L("Website", "웹사이트", "网址")} className="sheet-input" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} /></Field><Field label={L("Page content", "페이지 내용", "网页内容")}><textarea aria-label={L("Page content", "페이지 내용", "网页内容")} className="sheet-input" rows={12} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></Field>{error && <p className="text-destructive" role="alert">{error}</p>}</div><EditBar save={label(lang, "save")} cancel={label(lang, "cancel")} onCancel={() => { setDraft(null); setError(""); }} onSave={() => { const url = safeBrowserUrl(draft.url); if (!url) { setError(L("Enter a valid web address", "올바른 주소를 입력하세요", "请输入有效网址")); return; } setPages((old) => old.some((p) => p.id === draft.id) ? old.map((p) => p.id === draft.id ? { ...draft, url } : p) : [...old, { ...draft, url }]); setDraft(null); setError(""); }} /></div>;
  return <div className="app-page safari-native">
    <TopBar className="native-clean-top" left={<Button variant="ghost" size="icon" aria-label={label(lang, "back")} onClick={onHome}><ChevronLeft /></Button>} title={current ? current.title : "Safari"} right={<Button variant="ghost" size="icon" aria-label={label(lang, "edit")} onClick={() => { setDraft(current ? { ...current } : { id: uid(), title: "", url: "https://", body: "" }); setError(""); }}><SquarePen /></Button>} />
    <div className="flex-1 overflow-y-auto safari-content">
      {current ? <article className="safari-article"><p className="safari-domain"><Globe size={14} />{current.url}</p><h1>{current.title}</h1><div className="whitespace-pre-wrap break-words">{current.body}</div><a className="text-primary inline-flex items-center gap-2 mt-8" href={safeBrowserUrl(current.url) ?? undefined} target="_blank" rel="noreferrer"><Globe size={16} />{L("Open website", "웹사이트 열기", "打开网站")}</a></article> : <>
        <div className="safari-section-heading"><h1>{panel === "history" ? L("History", "방문 기록", "历史记录") : panel === "tabs" ? L("Tabs", "탭", "标签页") : L("Favorites", "즐겨찾기", "收藏")}</h1><Button variant="ghost" size="icon" aria-label={L("Add favorite", "즐겨찾기 추가", "添加收藏")} onClick={() => setDraft({ id: uid(), title: "", url: "https://", body: "" })}><Plus /></Button></div>
        {panel === "history" ? history.map((visit) => <div className="safari-history-row" key={visit.id}><Button variant="ghost" className="flex-1 min-w-0 justify-start" onClick={() => { const saved = pages.find((p) => p.url === visit.url); if (saved) navigate(saved); else { setAddress(visit.url); const url = safeBrowserUrl(visit.url); if (url) window.open(url, "_blank", "noopener,noreferrer"); } }}><Clock size={18} /><span className="min-w-0 text-left"><b className="block truncate">{visit.title}</b><small className="block truncate">{visit.url}</small></span></Button><Button variant="ghost" size="icon" aria-label={label(lang, "delete")} onClick={() => { if (confirmDelete(lang)) setHistory((old) => old.filter((v) => v.id !== visit.id)); }}><Trash2 size={16} /></Button></div>) : <div className="safari-favorites">{(panel === "tabs" ? pages.filter((p) => trail.includes(p.id)) : pages).map((page) => <div className="safari-favorite" key={page.id}><Button variant="ghost" className="safari-favorite-open" onClick={() => navigate(page)}><span><Globe size={30} /></span><b>{page.title}</b></Button><Button variant="ghost" size="icon" className="safari-favorite-edit" aria-label={`${label(lang, "edit")} ${page.title}`} onClick={() => setDraft({ ...page })}><SquarePen size={13} /></Button></div>)}</div>}
        {(panel === "history" ? history.length === 0 : pages.length === 0) && <p className="native-empty">{L("No saved pages", "저장된 페이지 없음", "暂无保存的网页")}</p>}
      </>}
    </div>
    <form className="safari-address" onSubmit={(e) => { e.preventDefault(); submit(); }}><Search size={16} /><input aria-label={L("Search or enter website", "검색 또는 웹사이트 입력", "搜索或输入网址")} placeholder={L("Search or enter website", "검색 또는 웹사이트 입력", "搜索或输入网址")} value={address} onChange={(e) => setAddress(e.target.value)} /><Button type="submit" variant="ghost" size="icon" aria-label={L("Go", "이동", "前往")}><ArrowRight size={18} /></Button></form>
    {error && <p className="text-destructive text-xs px-4" role="alert">{error}</p>}
    <nav className="safari-toolbar"><Button variant="ghost" size="icon" disabled={cursor === 0} aria-label={L("Back page", "이전 페이지", "上一页")} onClick={() => go(-1)}><ArrowLeft /></Button><Button variant="ghost" size="icon" disabled={cursor >= trail.length - 1} aria-label={L("Forward page", "다음 페이지", "下一页")} onClick={() => go(1)}><ArrowRight /></Button><Button variant="ghost" size="icon" disabled={!current} aria-label={L("Share", "공유", "分享")} onClick={() => { if (current) { void navigator.clipboard?.writeText(current.url).catch(() => setError(L("Could not copy link", "링크를 복사할 수 없습니다", "无法复制链接"))); } }}><Share /></Button><Button variant="ghost" size="icon" aria-label={L("Bookmarks and history", "책갈피 및 방문 기록", "书签与历史记录")} onClick={() => { setSelected(null); setPanel(panel === "history" ? "favorites" : "history"); }}><BookOpen /></Button><Button variant="ghost" size="icon" aria-label={L("Tabs", "탭", "标签页")} onClick={() => { setSelected(null); setPanel("tabs"); }}><PanelsTopLeft /></Button></nav>
  </div>;
}
