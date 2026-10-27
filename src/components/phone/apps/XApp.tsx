import { useState } from "react";
import { type AppProps, tr } from "../i18n";
import { PROFILE, TWEETS, type Tweet } from "../story";
import { uid, usePersist } from "../store";
import { BackBtn, EditBar, Field, TopBar, resolveImg } from "../ui";
import { label, confirmDelete } from "../labels";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export default function XApp({ lang, onHome }: AppProps) {
  const [tweets, setTweets] = usePersist<Tweet[]>("x-tweets-v1", TWEETS);
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
          <textarea className="sheet-input" rows={4} value={draft.text} onChange={(e) => set({ text: e.target.value })} />
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
            <div className="flex gap-2"><input type="date" className="sheet-input" value={reply.date} onChange={(e) => set({ replies: draft.replies?.map((r) => r.id === reply.id ? { ...r, date: e.target.value } : r) ?? [] })} /><input type="time" className="sheet-input" value={reply.time} onChange={(e) => set({ replies: draft.replies?.map((r) => r.id === reply.id ? { ...r, time: e.target.value } : r) ?? [] })} /><Button variant="ghost" size="icon" aria-label={label(lang, "delete")} onClick={() => { if (confirmDelete(lang)) set({ replies: draft.replies?.filter((r) => r.id !== reply.id) ?? [] }); }}><Trash2 /></Button></div>
          </div>)}
          <Button variant="secondary" onClick={() => set({ replies: [...(draft.replies ?? []), { id: uid(), user: "", text: "", date: "2026-10-26", time: "20:26" }] })}><Plus />{label(lang, "reply")}</Button>
          {exists && <button className="w-full py-2.5 rounded-xl bg-muted text-destructive" onClick={() => { if (!confirmDelete(lang)) return; setTweets(tweets.filter((t) => t.id !== draft.id)); setDraft(null); setOpenId(null); }}>{tr(lang, { en: "Delete", ko: "삭제", zh: "删除" })}</button>}
        </div>
        <EditBar save={tr(lang, { en: "Save", ko: "저장", zh: "保存" })} cancel={tr(lang, { en: "Cancel", ko: "취소", zh: "取消" })}
          onCancel={() => setDraft(null)}
          onSave={() => { setTweets(exists ? tweets.map((t) => (t.id === draft.id ? draft : t)) : [draft, ...tweets]); setDraft(null); }} />
      </div>
    );
  }

  if (open) return <div className="app-page bg-background">
    <TopBar title="𝕏" left={<BackBtn onClick={() => setOpenId(null)} />} right={<Button variant="ghost" onClick={() => setDraft({ ...open, replies: (open.replies ?? []).map((r) => ({ ...r })) })}>{label(lang, "edit")}</Button>} />
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <b>성찬 <span className="text-muted-foreground font-normal">@zcc_daily</span></b>
      <p className="text-lg whitespace-pre-wrap">{open.text}</p>
      <p className="text-xs text-muted-foreground">{open.date} {open.time} · ♡ {open.likes} · ⟲ {open.rts}</p>
      <h2 className="text-sm font-semibold border-t pt-4">{label(lang, "replies")}</h2>
      {(open.replies ?? []).map((reply) => <div key={reply.id} className="border-b pb-3"><b className="text-sm">{reply.user}</b><p className="whitespace-pre-wrap">{reply.text}</p><p className="text-xs text-muted-foreground">{reply.date} {reply.time}</p></div>)}
      <Button variant="secondary" onClick={() => setDraft({ ...open, replies: [...(open.replies ?? []), { id: uid(), user: "", text: "", date: "2026-10-26", time: "20:26" }] })}><Plus />{label(lang, "reply")}</Button>
    </div>
  </div>;

  return (
    <div className="app-page bg-background">
      <TopBar left={<BackBtn onClick={onHome} />} title={<span className="text-xl">𝕏</span>} />
      <div className="flex-1 overflow-y-auto">
        {sorted.map((t) => (
          <button key={t.id} onClick={() => setOpenId(t.id)} className="w-full text-left flex gap-3 px-4 py-3 border-b">
            <img src={resolveImg(PROFILE.avatar)} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm"><b>성찬</b> <span className="text-muted-foreground">@zcc_daily · {t.date.replaceAll("-", ".")} {t.time}</span></div>
              <p className="text-[15px] mt-0.5 whitespace-pre-line">{t.text}</p>
              <div className="flex gap-8 mt-2 text-xs text-muted-foreground"><span>💬</span><span>⟲ {t.rts}</span><span>♡ {t.likes}</span></div>
            </div>
          </button>
        ))}
        <p className="text-[10px] text-center text-muted-foreground py-3">{label(lang, "fictional")}</p>
      </div>
      <button className="x-fab" onClick={() => setDraft({ id: uid(), text: "", date: "2026-10-26", time: "20:00", likes: 0, rts: 0 })}>＋</button>
    </div>
  );
}
