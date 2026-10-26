import { useState } from "react";
import { type AppProps, tr } from "../i18n";
import { NOTES, type Note } from "../story";
import { uid, usePersist } from "../store";
import { BackBtn, EditBar, TopBar } from "../ui";

export default function Notes({ lang, onHome }: AppProps) {
  const [notes, setNotes] = usePersist<Note[]>("notes-v1", NOTES);
  const [draft, setDraft] = useState<Note | null>(null);
  const sorted = [...notes].sort((a, b) => b.date.localeCompare(a.date));

  if (draft) {
    const exists = notes.some((n) => n.id === draft.id);
    return (
      <div className="app-page notes-bg">
        <TopBar left={<span />} title={<input type="date" className="bg-transparent text-xs text-center" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />}
          right={exists ? <button className="text-destructive text-sm" onClick={() => { setNotes(notes.filter((n) => n.id !== draft.id)); setDraft(null); }}>{tr(lang, { en: "Delete", ko: "삭제", zh: "删除" })}</button> : undefined} />
        <div className="flex-1 flex flex-col px-5 pb-3">
          <input className="bg-transparent text-2xl font-bold outline-none py-2" value={draft.title} placeholder={tr(lang, { en: "Title", ko: "제목", zh: "标题" })} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <textarea className="flex-1 bg-transparent outline-none text-[15px] leading-relaxed resize-none" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
        </div>
        <EditBar save={tr(lang, { en: "Save", ko: "저장", zh: "保存" })} cancel={tr(lang, { en: "Cancel", ko: "취소", zh: "取消" })}
          onCancel={() => setDraft(null)}
          onSave={() => { setNotes(exists ? notes.map((n) => (n.id === draft.id ? draft : n)) : [draft, ...notes]); setDraft(null); }} />
      </div>
    );
  }

  return (
    <div className="app-page notes-bg">
      <TopBar left={<BackBtn onClick={onHome} />} title={tr(lang, { en: "Notes", ko: "메모", zh: "备忘录" })}
        right={<button className="notes-accent text-xl" onClick={() => setDraft({ id: uid(), title: "", body: "", date: "2026-10-26" })}>✎</button>} />
      <div className="flex-1 overflow-y-auto px-4">
        <div className="rounded-xl bg-background divide-y">
          {sorted.map((n) => (
            <button key={n.id} className="w-full text-left px-4 py-3" onClick={() => setDraft({ ...n })}>
              <div className="font-semibold text-[15px] truncate">{n.title || "—"}</div>
              <div className="text-[13px] text-muted-foreground truncate">{n.date.replaceAll("-", ".")} &nbsp;{n.body.split("\n")[0]}</div>
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground py-3">{notes.length} {tr(lang, { en: "notes", ko: "개의 메모", zh: "个备忘录" })}</p>
      </div>
    </div>
  );
}
