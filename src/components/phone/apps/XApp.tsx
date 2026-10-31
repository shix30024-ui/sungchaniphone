import { useState } from "react";
import { type AppProps, tr } from "../i18n";
import { PROFILE, TWEETS, type Tweet } from "../story";
import { uid, usePersist } from "../store";
import { BackBtn, EditBar, Field, TopBar, resolveImg } from "../ui";
import { label, confirmDelete } from "../labels";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, MessageCircle, Repeat2, Heart, BarChart2, Share, Home, Search, Bell, Mail, ChevronLeft } from "lucide-react";
import { xText, editXText } from "../x-language";
import { useOwner } from "../owner";

export default function XApp({ lang, onHome }: AppProps) {
  const owner = useOwner();
  const [tweets, setTweets] = usePersist<Tweet[]>("x-tweets-v2", TWEETS);
  const [draft, setDraft] = useState<Tweet | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = tweets.find((tweet) => tweet.id === openId);
  const sorted = [...tweets].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  if (draft) {
    const set = (p: Partial<Tweet>) => setDraft({ ...draft, ...p });
    const exists = tweets.some((t) => t.id === draft.id);
    return (
      <div className="app-page bg-background">
        <TopBar title={tr(lang, { en: "Edit post", ko: "게시물 수정", zh: "编辑推文" })} />
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <Field label={tr(lang, { en: "Original post", ko: "게시물 원문", zh: "推文原文" })}><textarea aria-label={tr(lang, { en: "Original post", ko: "게시물 원문", zh: "推文原文" })} className="sheet-input" rows={3} value={draft.text} onChange={(e) => set({ text: e.target.value })} /></Field>
          {(["ko", "zh", "en"] as const).map((language) => <Field key={language} label={{ ko: "한국어", zh: "简体中文", en: "English" }[language]}><textarea aria-label={language} className="sheet-input" rows={3} value={xText(draft, language)} onChange={(e) => setDraft(editXText(draft, language, e.target.value))} /></Field>)}
          <div className="flex gap-2">
            <Field label={tr(lang, { en: "Date", ko: "날짜", zh: "日期" })}><input type="date" className="sheet-input" value={draft.date} onChange={(e) => set({ date: e.target.value })} /></Field>
            <Field label={tr(lang, { en: "Time", ko: "시간", zh: "时间" })}><input type="time" className="sheet-input" value={draft.time} onChange={(e) => set({ time: e.target.value })} /></Field>
          </div>
          <div className="flex gap-2">
            <Field label="♡"><input type="number" className="sheet-input" value={draft.likes} onChange={(e) => set({ likes: +e.target.value })} /></Field>
            <Field label="⟲"><input type="number" className="sheet-input" value={draft.rts} onChange={(e) => set({ rts: +e.target.value })} /></Field>
          </div>
          <h2 className="text-sm font-semibold">{label(lang, "replies")}</h2>
          {(draft.replies ?? []).map((reply) => <div key={reply.id} className="space-y-2 border-b pb-3">
            <Field label={label(lang, "username")}><input className="sheet-input" value={reply.user} onChange={(e) => set({ replies: draft.replies?.map((r) => r.id === reply.id ? { ...r, user: e.target.value } : r) ?? [] })} /></Field>
            <Field label={label(lang, "reply")}><textarea className="sheet-input" value={reply.text} onChange={(e) => set({ replies: draft.replies?.map((r) => r.id === reply.id ? { ...r, text: e.target.value } : r) ?? [] })} /></Field>
            {(["ko", "zh", "en"] as const).map((language) => <Field key={language} label={{ ko: "한국어", zh: "简体中文", en: "English" }[language]}><textarea aria-label={`reply-${language}`} className="sheet-input" value={xText(reply, language)} onChange={(e) => set({ replies: draft.replies?.map((r) => r.id === reply.id ? editXText(r, language, e.target.value) : r) ?? [] })} /></Field>)}
            <div className="flex gap-2"><input type="date" className="sheet-input" value={reply.date} onChange={(e) => set({ replies: draft.replies?.map((r) => r.id === reply.id ? { ...r, date: e.target.value } : r) ?? [] })} /><input type="time" className="sheet-input" value={reply.time} onChange={(e) => set({ replies: draft.replies?.map((r) => r.id === reply.id ? { ...r, time: e.target.value } : r) ?? [] })} /><Button variant="ghost" size="icon" aria-label={label(lang, "delete")} onClick={() => { if (confirmDelete(lang)) set({ replies: draft.replies?.filter((r) => r.id !== reply.id) ?? [] }); }}><Trash2 /></Button></div>
          </div>)}
          <Button variant="secondary" onClick={() => set({ replies: [...(draft.replies ?? []), { id: uid(), user: "", text: "", date: "2026-10-26", time: "20:26" }] })}><Plus />{label(lang, "reply")}</Button>
          {exists && <button className="w-full py-2.5 rounded-xl bg-muted text-destructive" onClick={() => { if (!confirmDelete(lang)) return; setTweets(tweets.filter((t) => t.id !== draft.id)); setDraft(null); setOpenId(null); }}>{tr(lang, { en: "Delete", ko: "삭제", zh: "删除" })}</button>}
        </div>
        <EditBar save={tr(lang, { en: "Save", ko: "저장", zh: "保存" })} cancel={tr(lang, { en: "Cancel", ko: "취소", zh: "取消" })}
          onCancel={() => setDraft(null)}
          onSave={() => { setTweets((current) => exists ? current.map((t) => (t.id === draft.id ? draft : t)) : [draft, ...current]); setDraft(null); }} />
      </div>
    );
  }

  const actions = (t: Tweet) => <div className="x-actions"><span><MessageCircle size={16} />{t.replies?.length || ""}</span><span><Repeat2 size={17} />{t.rts}</span><span><Heart size={16} />{t.likes}</span><span><BarChart2 size={16} />{t.likes * 37 + t.rts * 11}</span><Share size={16} /></div>;
  if (open) return <div className="app-page bg-background">
    <TopBar title={tr(lang, { en: "Post", ko: "게시물", zh: "帖子" })} left={<BackBtn onClick={() => setOpenId(null)} />} right={owner && <Button variant="ghost" onClick={() => setDraft({ ...open, replies: (open.replies ?? []).map((r) => ({ ...r })) })}>{label(lang, "edit")}</Button>} />
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="flex gap-3 items-center"><img src="https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png" alt="" className="w-10 h-10 rounded-full object-cover" /><span className="leading-tight"><b className="block">{"ontgna"}</b><span className="text-sm text-muted-foreground">@iiiston123</span></span></div>
      <p className="text-[17px] whitespace-pre-wrap">{xText(open, lang)}</p>
      <p className="text-sm text-muted-foreground">{open.time} · {open.date.replaceAll("-", ".")}</p>
      <p className="text-sm border-y py-2.5"><b>{open.rts}</b> <span className="text-muted-foreground">{tr(lang, { en: "Reposts", ko: "재게시", zh: "转帖" })}</span>  <b className="ml-3">{open.likes}</b> <span className="text-muted-foreground">{tr(lang, { en: "Likes", ko: "마음에 들어요", zh: "喜欢" })}</span></p>
      <h2 className="text-sm font-semibold border-t pt-4">{label(lang, "replies")}</h2>
      {(open.replies ?? []).map((reply) => <div key={reply.id} className="flex gap-3 border-b pb-3"><span className="x-reply-avatar">{reply.user.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="text-sm"><b>{reply.user}</b> <span className="text-muted-foreground">· {reply.date.replaceAll("-", ".")} {reply.time}</span></p><p className="text-[15px] whitespace-pre-wrap">{xText(reply, lang)}</p></div></div>)}
      {owner && <Button variant="secondary" onClick={() => setDraft({ ...open, replies: [...(open.replies ?? []), { id: uid(), user: "", text: "", date: "2026-10-26", time: "20:26" }] })}><Plus />{label(lang, "reply")}</Button>}
    </div>
  </div>;

  return (
    <div className="app-page bg-background">
      <header className="x-header"><button aria-label={tr(lang, { en: "Back", ko: "뒤로", zh: "返回" })} onClick={onHome} className="x-back"><ChevronLeft size={20} /><img src="https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png" alt="" /></button><span className="x-logo">𝕏</span></header>
      <div className="x-tabs"><b>{tr(lang, { en: "For you", ko: "추천", zh: "为你推荐" })}</b><span>{tr(lang, { en: "Following", ko: "팔로우 중", zh: "正在关注" })}</span></div>
      <div className="flex-1 overflow-y-auto">
        {sorted.map((t) => (
          <button key={t.id} onClick={() => setOpenId(t.id)} className="w-full text-left flex gap-3 px-4 py-3 border-b">
            <img src="https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png" alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[15px] truncate"><b>{"ontgna"}</b> <span className="text-muted-foreground">@iiiston123 · {t.date.slice(5).replace("-", "/")}</span></div>
              <p className="text-[15px] mt-0.5 whitespace-pre-line">{xText(t, lang)}</p>
              {actions(t)}
            </div>
          </button>
        ))}
        <p className="text-[10px] text-center text-muted-foreground py-3">{label(lang, "fictional")}</p>
      </div>
      {owner && <button className="x-fab" aria-label={tr(lang, { en: "Post", ko: "게시하기", zh: "发帖" })} onClick={() => setDraft({ id: uid(), text: "", date: "2026-10-26", time: "20:00", likes: 0, rts: 0 })}><Plus /></button>}
      <nav className="x-nav"><Home strokeWidth={2.6} /><Search /><Bell /><Mail /></nav>
    </div>
  );
}
