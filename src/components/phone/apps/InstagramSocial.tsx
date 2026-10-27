import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X, ChevronLeft, ChevronRight, Send, Plus, Trash2 } from "lucide-react";
import { CONTACTS, type Msg, type Post, type Profile } from "../story";
import { usePersist, uid } from "../store";
import { DM_KEY, QUEUE_KEY, sendChat, type PendingReply } from "../conversation";
import { messageText, STORY_DATE } from "../chronology";
import { tr, type Lang } from "../i18n";
import { confirmDelete, label } from "../labels";
import { ImageField, KktAvatar, resolveImg, TopBar, EditBar } from "../ui";
import { postImages } from "../media";

type Story = { id: string; user: string; image: string; text: string; date: string };
export const STORIES_KEY = "ig-stories-v1";
const SEEN_KEY = "ig-story-seen-v1";

export function Stories({ posts, profile, lang }: { posts: Post[]; profile: Profile; lang: Lang }) {
  const [stored, setStored] = usePersist<Story[] | null>(STORIES_KEY, null);
  // Derive a small gallery from existing posts, never altering or copying over the posts themselves.
  const stories = stored ?? posts.slice(0, 4).map((p) => ({ id: `story-${p.id}`, user: profile.username, image: postImages(p)[0] ?? "", text: p.caption, date: p.date }));
  const [seen, setSeen] = usePersist<string[]>(SEEN_KEY, []);
  const [index, setIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Story | null>(null);
  const active = index === null ? undefined : stories[index];
  useEffect(() => { if (active && !seen.includes(active.id)) setSeen((current) => [...current, active.id]); }, [active?.id]);
  if (draft) return <div className="ig-overlay app-page bg-background">
    <TopBar title={label(lang, "edit")} /><div className="flex-1 overflow-y-auto p-4 space-y-3">
      <ImageField label={label(lang, "photo")} value={draft.image} onChange={(image) => setDraft({ ...draft, image })} />
      <input className="sheet-input" aria-label={label(lang, "username")} value={draft.user} onChange={(e) => setDraft({ ...draft, user: e.target.value })} />
      <textarea className="sheet-input" aria-label={label(lang, "caption")} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
      <input type="date" className="sheet-input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
      <Button variant="destructive" onClick={() => { if (confirmDelete(lang)) { setStored(stories.filter((s) => s.id !== draft.id)); setDraft(null); setIndex(null); } }}><Trash2 />{label(lang, "delete")}</Button>
    </div><EditBar save={label(lang, "save")} cancel={label(lang, "cancel")} onCancel={() => setDraft(null)} onSave={() => { setStored(stories.some((s) => s.id === draft.id) ? stories.map((s) => s.id === draft.id ? draft : s) : [...stories, draft]); setDraft(null); }} /></div>;
  return <>
    <div className="ig-stories">
      <Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Add story", ko: "스토리 추가", zh: "新增快拍" })} onClick={() => setDraft({ id: uid(), user: profile.username, image: "", text: "", date: STORY_DATE })}><Plus /></Button>
      {stories.map((s, i) => <Button variant="ghost" key={s.id} className="ig-story-item" onClick={() => setIndex(i)} aria-label={`${tr(lang, { en: "Story", ko: "스토리", zh: "快拍" })} ${i + 1}`}><img src={resolveImg(s.image)} className={`ig-story-avatar ${seen.includes(s.id) ? "ig-story-seen" : ""}`} alt="" /><span>{s.user}</span></Button>)}
    </div>
    {active && <div className="ig-overlay ig-story-view">
      <div className="flex gap-1 p-3">{stories.map((s, i) => <span key={s.id} className={`ig-progress ${i <= (index ?? 0) ? "ig-progress-done" : ""}`} />)}</div>
      <div className="flex justify-between items-center px-3"><b className="text-sm">{active.user} · {active.date}</b><Button variant="ghost" size="icon" aria-label={label(lang, "cancel")} onClick={() => setIndex(null)}><X /></Button></div>
      <img src={resolveImg(active.image)} className="ig-story-media" alt="" />
      <p className="text-center p-4 whitespace-pre-wrap">{active.text}</p>
      <div className="flex justify-between px-4 pb-5"><Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Previous story", ko: "이전 스토리", zh: "上一条快拍" })} disabled={index === 0} onClick={() => setIndex((index ?? 0) - 1)}><ChevronLeft /></Button><Button variant="ghost" onClick={() => setDraft({ ...active })}>{label(lang, "edit")}</Button><Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Next story", ko: "다음 스토리", zh: "下一条快拍" })} onClick={() => setIndex((index ?? 0) < stories.length - 1 ? (index ?? 0) + 1 : null)}><ChevronRight /></Button></div>
    </div>}
  </>;
}

export function InstagramDM({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const [msgs, setMsgs] = usePersist<Msg[]>(DM_KEY, []);
  const [queue] = usePersist<PendingReply[]>(QUEUE_KEY, []);
  const [contacts] = usePersist("kkt-contacts-v1", CONTACTS);
  const [open, setOpen] = useState<string | null>(null);
  const [text, setText] = useState("");
  const scroll = useRef<HTMLDivElement>(null);
  const contact = contacts.find((c) => c.id === open);
  const typing = queue.some((q) => q.channel === "ig" && q.contactId === open);
  const thread = msgs.filter((m) => m.contactId === open);
  useEffect(() => {
    if (!open) return;
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
    if (thread.some((m) => m.sender === "them" && !m.read)) setMsgs((current) => current.map((m) => m.contactId === open && m.sender === "them" ? { ...m, read: true } : m));
  }, [msgs, open, typing]);
  return <div className="app-page bg-background">
    <TopBar title={contact?.name ?? tr(lang, { en: "Messages", ko: "메시지", zh: "私信" })} left={<Button variant="ghost" size="icon" aria-label={label(lang, "cancel")} onClick={() => contact ? setOpen(null) : onClose()}><ArrowLeft /></Button>} />
    {!contact ? <div className="flex-1 overflow-y-auto">{contacts.filter((c) => ["anton", "minjae", "doyun"].includes(c.id)).map((c) => {
      const latest = msgs.filter((m) => m.contactId === c.id).at(-1);
      const unread = msgs.filter((m) => m.contactId === c.id && m.sender === "them" && !m.read).length;
      return <Button key={c.id} variant="ghost" className="w-full h-auto justify-start py-4 gap-3" onClick={() => setOpen(c.id)}><KktAvatar src={c.avatar} /><span className="min-w-0 text-left flex-1"><b className="block">{c.name}</b><span className="block truncate text-xs text-muted-foreground">{latest ? messageText(latest, lang) : ""}</span></span>{unread > 0 && <span className="kkt-badge">{unread}</span>}</Button>;
    })}</div> : <>
      <div ref={scroll} className="flex-1 overflow-y-auto p-3 space-y-3">{thread.map((m) => <div key={m.id} className={`flex flex-col ${m.sender === "me" ? "items-end" : "items-start"}`}><div className={`ig-dm-bubble ${m.sender === "me" ? "ig-dm-mine" : ""}`}>{messageText(m, lang)}</div><span className="text-[10px] text-muted-foreground mt-1">{m.time}</span></div>)}{typing && <span role="status" aria-label={tr(lang, { en: "Typing", ko: "입력 중", zh: "正在输入" })} className="typing-dots"><i /><i /><i /></span>}</div>
      <form className="kkt-input" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; sendChat("ig", contact.id, text.trim(), lang); setText(""); }}><input className="kkt-compose" aria-label={tr(lang, { en: "DM message", ko: "메시지 입력", zh: "输入私信" })} value={text} onChange={(e) => setText(e.target.value)} /><Button size="icon" disabled={!text.trim()} aria-label={tr(lang, { en: "Send DM", ko: "메시지 보내기", zh: "发送私信" })}><Send /></Button></form>
    </>}
  </div>;
}