import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Send, Plus, Trash2, Camera, SquarePen, Search } from "lucide-react";
import { type Msg, type Post, type Profile } from "../story";
import { usePersist, uid } from "../store";
import { DM_KEY, QUEUE_KEY, sendChat, type PendingReply } from "../conversation";
import { messageText, STORY_DATE } from "../chronology";
import { tr, type Lang } from "../i18n";
import { confirmDelete, label } from "../labels";
import { ImageField, KktAvatar, resolveImg, TopBar, EditBar } from "../ui";
import { SELF_ID, dmAccount, type SocialAccount } from "../social";
import { postImages } from "../media";
import { useOwner } from "../owner";

type Story = { id: string; user: string; image: string; text: string; date: string; authorId?: string };
export const STORIES_KEY = "ig-stories-v1";
const SEEN_KEY = "ig-story-seen-v1";

export function Stories({ posts, profile, accounts, lang, onProfile }: { posts: (Post & { authorId?: string })[]; profile: Profile; accounts: SocialAccount[]; lang: Lang; onProfile: (id: string) => void }) {
  const owner = useOwner();
  const [stored, setStored] = usePersist<Story[] | null>(STORIES_KEY, null);
  const [friendStored, setFriendStored] = usePersist<Story[] | null>("ig-friend-stories-v1", null);
  // Derive a small gallery from existing posts, never altering or copying over the posts themselves.
  const ownStories = stored ?? posts.filter((p) => !p.authorId || p.authorId === SELF_ID).slice(0, 4).map((p) => ({ id: `story-${p.id}`, authorId: SELF_ID, user: profile.username, image: postImages(p)[0] ?? "", text: p.caption, date: p.date }));
  const friendStories = friendStored ?? posts.filter((p, i, all) => p.authorId && p.authorId !== SELF_ID && all.findIndex((other) => other.authorId === p.authorId) === i).map((p) => ({ id: `friend-story-${p.id}`, authorId: p.authorId ?? SELF_ID, user: accounts.find((a) => a.id === p.authorId)?.username ?? "", image: postImages(p)[0] ?? "", text: p.caption, date: p.date }));
  const stories = [...ownStories, ...friendStories];
  const saveStory = (draft: Story) => {
    if (friendStories.some((s) => s.id === draft.id)) setFriendStored(friendStories.map((s) => s.id === draft.id ? draft : s));
    else setStored(ownStories.some((s) => s.id === draft.id) ? ownStories.map((s) => s.id === draft.id ? draft : s) : [...ownStories, draft]);
  };
  const removeStory = (id: string) => { if (friendStories.some((s) => s.id === id)) setFriendStored(friendStories.filter((s) => s.id !== id)); else setStored(ownStories.filter((s) => s.id !== id)); };
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
      <Button variant="destructive" onClick={() => { if (confirmDelete(lang)) { removeStory(draft.id); setDraft(null); setIndex(null); } }}><Trash2 />{label(lang, "delete")}</Button>
    </div><EditBar save={label(lang, "save")} cancel={label(lang, "cancel")} onCancel={() => setDraft(null)} onSave={() => { saveStory(draft); setDraft(null); }} /></div>;
  return <>
    <div className="ig-stories">
      {owner && <Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Add story", ko: "스토리 추가", zh: "新增快拍" })} onClick={() => setDraft({ id: uid(), user: profile.username, image: "", text: "", date: STORY_DATE })}><Plus /></Button>}
      {stories.map((s, i) => <Button variant="ghost" key={s.id} className="ig-story-item" onClick={() => setIndex(i)} aria-label={`${tr(lang, { en: "Story", ko: "스토리", zh: "快拍" })} ${i + 1}`}><img src={resolveImg(s.image)} className={`ig-story-avatar ${seen.includes(s.id) ? "ig-story-seen" : ""}`} alt="" /><span>{s.user}</span></Button>)}
    </div>
    {active && <div className="ig-overlay ig-story-view">
      <div className="flex gap-1 p-3">{stories.map((s, i) => <span key={s.id} className={`ig-progress ${i <= (index ?? 0) ? "ig-progress-done" : ""}`} />)}</div>
      <div className="flex justify-between items-center px-3"><Button variant="ghost" className="text-sm" onClick={() => { const authorId = active.authorId ?? (active.user === profile.username ? SELF_ID : accounts.find((a) => a.username === active.user)?.id); if (authorId) { setIndex(null); onProfile(authorId); } }}>{active.user} · {active.date}</Button><Button variant="ghost" size="icon" aria-label={label(lang, "cancel")} onClick={() => setIndex(null)}><X /></Button></div>
      <img src={resolveImg(active.image)} className="ig-story-media" alt="" />
      <p className="text-center p-4 whitespace-pre-wrap">{active.text}</p>
      <div className="flex justify-between px-4 pb-5"><Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Previous story", ko: "이전 스토리", zh: "上一条快拍" })} disabled={index === 0} onClick={() => setIndex((index ?? 0) - 1)}><ChevronLeft /></Button>{owner && <Button variant="ghost" onClick={() => setDraft({ ...active })}>{label(lang, "edit")}</Button>}<Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Next story", ko: "다음 스토리", zh: "下一条快拍" })} onClick={() => setIndex((index ?? 0) < stories.length - 1 ? (index ?? 0) + 1 : null)}><ChevronRight /></Button></div>
    </div>}
  </>;
}

export function InstagramDM({ accounts, lang, onClose }: { accounts: SocialAccount[]; lang: Lang; onClose: () => void }) {
  const owner = useOwner();
  const [msgs, setMsgs] = usePersist<Msg[]>(DM_KEY, []);
  // Add this fictional follower's opening DM once, without replacing any saved conversations.
  useEffect(() => {
    if (msgs.some((m) => m.contactId === "yuna")) return;
    setMsgs((current) => current.some((m) => m.contactId === "yuna") ? current : [...current, {
      id: "ig-yuna-first-dm-20261028", contactId: "yuna", sender: "them", type: "text",
      ko: "안녕하세요! 사진 분위기가 좋아서 팔로우했어요 :)",
      zh: "你好！觉得你的照片很有氛围，所以关注你了 :)",
      en: "Hi! I really liked the mood of your photos, so I followed you :)",
      date: "2026-10-28", time: "19:42", order: Date.now(), read: false,
    }]);
  }, [msgs, setMsgs]);
  const [queue] = usePersist<PendingReply[]>(QUEUE_KEY, []);
  const contacts = accounts;
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Msg | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [text, setText] = useState("");
  const scroll = useRef<HTMLDivElement>(null);
  const contact = open ? dmAccount(accounts, open) : undefined;
  const typing = queue.some((q) => !q.failed && q.channel === "ig" && q.contactId === open);
  const thread = msgs.filter((m) => m.contactId === open);
  useEffect(() => {
    if (!open) return;
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
    if (thread.some((m) => m.sender === "them" && !m.read)) setMsgs((current) => current.map((m) => m.contactId === open && m.sender === "them" ? { ...m, read: true } : m));
  }, [msgs, open, typing]);
  const shown = contacts.filter((c) => `${c.name} ${c.username}`.toLowerCase().includes(search.toLowerCase()));
  if (editing) return <div className="app-page bg-background ig-dm"><TopBar title={label(lang, "edit")} /><div className="flex-1 overflow-y-auto p-4 space-y-3"><select className="sheet-input" aria-label={tr(lang, { en: "Sender", ko: "발신자", zh: "发送者" })} value={editing.sender} onChange={(e) => setEditing({ ...editing, sender: e.target.value as Msg["sender"] })}><option value="me">{tr(lang, { en: "Me", ko: "나", zh: "我" })}</option><option value="them">{contact?.name}</option></select>{(["ko", "zh", "en"] as const).map((language) => <textarea key={language} className="sheet-input" aria-label={language} value={editing[language] ?? ""} onChange={(e) => setEditing({ ...editing, [language]: e.target.value })} />)}<input type="date" className="sheet-input" aria-label={label(lang, "date")} value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /><input type="time" className="sheet-input" value={editing.time} onChange={(e) => setEditing({ ...editing, time: e.target.value })} /><Button variant="destructive" onClick={() => { if (confirmDelete(lang)) { setMsgs((old) => old.filter((m) => m.id !== editing.id)); setEditing(null); } }}><Trash2 />{label(lang, "delete")}</Button></div><EditBar save={label(lang, "save")} cancel={label(lang, "cancel")} onCancel={() => setEditing(null)} onSave={() => { setMsgs((old) => old.map((m) => m.id === editing.id ? editing : m)); setEditing(null); }} /></div>;
  return <div className="app-page bg-background ig-dm">
    <header className="ig-header"><Button variant="ghost" size="icon" aria-label={label(lang, "cancel")} onClick={() => contact ? setOpen(null) : onClose()}><ChevronLeft /></Button>
      {contact ? <><KktAvatar src={contact.avatar} /><span className="min-w-0 flex-1"><b className="block text-sm truncate">{contact.name}</b><span className="block text-[11px] text-muted-foreground">{tr(lang, { en: "Active now", ko: "현재 활동 중", zh: "在线" })}</span></span></> : <><b className="flex-1 text-lg">{tr(lang, { en: "Messages", ko: "메시지", zh: "私信" })}</b><SquarePen size={22} /></>}
    </header>
    {!contact ? <div className="flex-1 overflow-y-auto">
      <div className="ig-dm-search"><Search size={16} /><input aria-label={label(lang, "search")} placeholder={label(lang, "search")} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <div className="ig-dm-notes">{shown.map((c) => <Button variant="ghost" className="h-auto" key={c.id} onClick={() => setOpen(c.id)}><KktAvatar src={c.avatar} /><span>{c.username}</span></Button>)}</div>
      <div className="flex justify-between px-4 py-2 text-sm"><b>{tr(lang, { en: "Messages", ko: "메시지", zh: "消息" })}</b><span className="text-muted-foreground">{tr(lang, { en: "Requests", ko: "요청", zh: "请求" })}</span></div>
      {shown.map((c) => {
      const latest = msgs.filter((m) => m.contactId === c.id).at(-1);
      const unread = msgs.filter((m) => m.contactId === c.id && m.sender === "them" && !m.read).length;
      return <Button key={c.id} variant="ghost" className="w-full h-auto justify-start py-2.5 px-4 gap-3 rounded-none" onClick={() => setOpen(c.id)}><span className="ig-dm-avatar"><KktAvatar src={c.avatar} /></span><span className="min-w-0 text-left flex-1"><span className={`block text-sm ${unread ? "font-bold" : "font-normal"}`}>{c.name}</span><span className={`block truncate text-xs ${unread ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{latest ? `${messageText(latest, lang)} · ${latest.time}` : ""}</span></span>{unread > 0 ? <span className="ig-dm-dot" /> : <Camera size={20} className="text-muted-foreground" />}</Button>;
    })}</div> : <>
      <div ref={scroll} className="flex-1 overflow-y-auto p-3 space-y-1.5">{thread.map((m) => <div key={m.id} className={`flex flex-col ${m.sender === "me" ? "items-end" : "items-start"}`}><div className="ig-dm-message-row">{m.sender === "them" && <span className="ig-dm-message-avatar"><KktAvatar src={contact.avatar} size={26} /></span>}<Button variant="ghost" className={`ig-dm-bubble ${m.sender === "me" ? "ig-dm-mine" : ""}`} aria-label={`${label(lang, "edit")} ${messageText(m, lang)}`} title={m.time} onClick={() => owner && setEditing({ ...m })}>{messageText(m, lang)}</Button></div></div>)}{thread.at(-1)?.sender === "me" && thread.at(-1)?.read !== false && <span className="block text-right text-[11px] text-muted-foreground">{tr(lang, { en: "Seen", ko: "읽음", zh: "已读" })}</span>}{typing && <span role="status" aria-label={tr(lang, { en: "Typing", ko: "입력 중", zh: "正在输入" })} className="typing-dots"><i /><i /><i /></span>}</div>
      <form className="ig-dm-compose" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; sendChat("ig", contact.id, text.trim(), lang); setText(""); }}><span className="ig-dm-cam"><Camera size={18} /></span><input aria-label={tr(lang, { en: "DM message", ko: "메시지 입력", zh: "输入私信" })} placeholder={tr(lang, { en: "Message...", ko: "메시지 보내기...", zh: "发消息…" })} value={text} onChange={(e) => setText(e.target.value)} /><Button variant="ghost" size="sm" className="ig-dm-send" disabled={!text.trim()} aria-label={tr(lang, { en: "Send DM", ko: "메시지 보내기", zh: "发送私信" })}>{tr(lang, { en: "Send", ko: "보내기", zh: "发送" })}</Button></form>
    </>}
  </div>;
}