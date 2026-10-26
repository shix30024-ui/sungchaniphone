import { useState } from "react";
import { type AppProps, tr } from "../i18n";
import { PROFILE, TWEETS, type Tweet } from "../story";
import { uid, usePersist } from "../store";
import { BackBtn, EditBar, Field, TopBar, resolveImg } from "../ui";

export default function XApp({ lang, onHome }: AppProps) {
  const [tweets, setTweets] = usePersist<Tweet[]>("x-tweets-v1", TWEETS);
  const [draft, setDraft] = useState<Tweet | null>(null);
  const sorted = [...tweets].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  if (draft) {
    const set = (p: Partial<Tweet>) => setDraft({ ...draft, ...p });
    const exists = tweets.some((t) => t.id === draft.id);
    return (
      <div className="app-page bg-background">
        <TopBar title={tr(lang, { en: "Edit post", ko: "게시물 수정", zh: "编辑推文" })} />
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <textarea className="sheet-input" rows={4} value={draft.text} onChange={(e) => set({ text: e.target.value })} />
          <div className="flex gap-2">
            <Field label={tr(lang, { en: "Date", ko: "날짜", zh: "日期" })}><input type="date" className="sheet-input" value={draft.date} onChange={(e) => set({ date: e.target.value })} /></Field>
            <Field label={tr(lang, { en: "Time", ko: "시간", zh: "时间" })}><input type="time" className="sheet-input" value={draft.time} onChange={(e) => set({ time: e.target.value })} /></Field>
          </div>
          <div className="flex gap-2">
            <Field label="♡"><input type="number" className="sheet-input" value={draft.likes} onChange={(e) => set({ likes: +e.target.value })} /></Field>
            <Field label="⟲"><input type="number" className="sheet-input" value={draft.rts} onChange={(e) => set({ rts: +e.target.value })} /></Field>
          </div>
          {exists && <button className="w-full py-2.5 rounded-xl bg-muted text-destructive" onClick={() => { setTweets(tweets.filter((t) => t.id !== draft.id)); setDraft(null); }}>{tr(lang, { en: "Delete", ko: "삭제", zh: "删除" })}</button>}
        </div>
        <EditBar save={tr(lang, { en: "Save", ko: "저장", zh: "保存" })} cancel={tr(lang, { en: "Cancel", ko: "취소", zh: "取消" })}
          onCancel={() => setDraft(null)}
          onSave={() => { setTweets(exists ? tweets.map((t) => (t.id === draft.id ? draft : t)) : [draft, ...tweets]); setDraft(null); }} />
      </div>
    );
  }

  return (
    <div className="app-page bg-background">
      <TopBar left={<BackBtn onClick={onHome} />} title={<span className="text-xl">𝕏</span>} />
      <div className="flex-1 overflow-y-auto">
        {sorted.map((t) => (
          <button key={t.id} onClick={() => setDraft({ ...t })} className="w-full text-left flex gap-3 px-4 py-3 border-b">
            <img src={resolveImg(PROFILE.avatar)} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm"><b>성찬</b> <span className="text-muted-foreground">@zcc_daily · {t.date.replaceAll("-", ".")} {t.time}</span></div>
              <p className="text-[15px] mt-0.5 whitespace-pre-line">{t.text}</p>
              <div className="flex gap-8 mt-2 text-xs text-muted-foreground"><span>💬</span><span>⟲ {t.rts}</span><span>♡ {t.likes}</span></div>
            </div>
          </button>
        ))}
        <p className="text-[10px] text-center text-muted-foreground py-3">Fictional fan work · 虚构创作</p>
      </div>
      <button className="x-fab" onClick={() => setDraft({ id: uid(), text: "", date: "2026-10-26", time: "20:00", likes: 0, rts: 0 })}>＋</button>
    </div>
  );
}
