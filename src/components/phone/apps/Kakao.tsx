import { useEffect, useRef, useState } from "react";
import { setActiveChat } from "../live";
import { type AppProps, tr } from "../i18n";
import { CONTACTS, MESSAGES, type Contact, type Msg, type MsgType } from "../story";
import { uid, usePersist } from "../store";
import { BackBtn, EditBar, Field, ImageField, KktAvatar, TopBar, resolveImg } from "../ui";
import { Button } from "@/components/ui/button";
import { Send, Phone, PhoneIncoming, Search, Menu, Plus, Smile, X } from "lucide-react";
import { fileToDataUrl } from "../store";
import Call from "./Call";
import { type PendingReply, QUEUE_KEY, sendChat } from "../conversation";
import { STORY_DATE, messageText, sortMessages } from "../chronology";
import { confirmDelete, label, localeFor } from "../labels";
import { completeTranslations } from "../translations";

const TODAY = STORY_DATE;
const sortMsgs = sortMessages<Msg>;

const koDate = (d: string, lang: AppProps["lang"]) => {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString(localeFor(lang), { year: "numeric", month: "long", day: "numeric", weekday: "long" });
};
const listTime = (m?: Msg) => (!m ? "" : m.date === TODAY ? m.time : m.date.startsWith("2026") ? m.date.slice(5).replace("-", ".") : m.date.replaceAll("-", "."));
const fmt12 = (t: string, lang: AppProps["lang"]) => {
  const [h = 0, mm = 0] = t.split(":").map(Number);
  const pm = h >= 12;
  return `${lang === "zh" ? (pm ? "下午" : "上午") : lang === "en" ? (pm ? "PM" : "AM") : pm ? "오후" : "오전"} ${h % 12 || 12}:${String(mm).padStart(2, "0")}`;
};

export default function Kakao({ lang, onHome, initialChat }: AppProps & { initialChat?: string | null }) {
  const [contacts, setContacts] = usePersist<Contact[]>("kkt-contacts-v1", CONTACTS);
  const [msgs, setMsgs] = usePersist<Msg[]>("kkt-msgs-v1", MESSAGES, completeTranslations);
  const [openId, setOpenId] = useState<string | null>(initialChat ?? null);
  useEffect(() => { setActiveChat(openId); return () => setActiveChat(null); }, [openId]);
  // Opening a chat marks it read. Works on the saved copy directly so defaults never overwrite saved edits.
  useEffect(() => {
    if (!openId) return;
    try {
      const ms = localStorage.getItem("kkt-msgs-v1");
      if (ms) {
        const list = JSON.parse(ms) as Msg[];
        if (list.some((m) => m.contactId === openId && m.live && !m.read)) {
          localStorage.setItem("kkt-msgs-v1", JSON.stringify(list.map((m) => (m.contactId === openId && m.live && !m.read ? { ...m, read: true } : m))));
          window.dispatchEvent(new CustomEvent("phone-store", { detail: "kkt-msgs-v1" }));
        }
      }
      const cs = localStorage.getItem("kkt-contacts-v1");
      if (cs) {
        const list = JSON.parse(cs) as Contact[];
        if (list.some((c) => c.id === openId && c.unread > 0)) {
          localStorage.setItem("kkt-contacts-v1", JSON.stringify(list.map((c) => (c.id === openId ? { ...c, unread: 0 } : c))));
          window.dispatchEvent(new CustomEvent("phone-store", { detail: "kkt-contacts-v1" }));
        }
      }
    } catch { /* keep chat usable even if storage is unavailable */ }
  }, [openId, msgs, contacts]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Msg[]>([]);
  const [draftC, setDraftC] = useState<Contact | null>(null);
  const [addingContact, setAddingContact] = useState(false);
  const [compose, setCompose] = useState("");
  const [call, setCall] = useState<"outgoing" | "incoming" | null>(null);
  const [menu, setMenu] = useState(false);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [emoji, setEmoji] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  const [queue] = usePersist<PendingReply[]>(QUEUE_KEY, []);
  const scroll = useRef<HTMLDivElement>(null);
  const editIds = useRef(new Set<string>());
  const typing = queue.some((q) => q.channel === "kkt" && q.contactId === openId);
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [msgs, openId, typing, editing]);

  const L = {
    chats: tr(lang, { en: "Chats", ko: "채팅", zh: "聊天" }),
    edit: tr(lang, { en: "Edit", ko: "편집", zh: "编辑" }),
    save: tr(lang, { en: "Save", ko: "저장", zh: "保存" }),
    cancel: tr(lang, { en: "Cancel", ko: "취소", zh: "取消" }),
    photo: label(lang, "photo"),
  };

  const open = contacts.find((c) => c.id === openId);

  if (!open) {
    const rows = contacts
      .map((c) => ({ c, last: sortMsgs(msgs.filter((m) => m.contactId === c.id && m.type !== "date")).at(-1) }))
      .sort((a, b) => ((b.last?.date ?? "") + (b.last?.time ?? "")).localeCompare((a.last?.date ?? "") + (a.last?.time ?? "")));
    return (
      <div className="app-page bg-background">
        <TopBar left={<BackBtn onClick={onHome} />} title={L.chats}
          right={<button className="text-sm" onClick={() => setAddingContact(true)}>＋</button>} />
        <div className="flex-1 overflow-y-auto">
          {rows.map(({ c, last }) => (
            <button key={c.id} className="w-full flex items-center gap-3 px-4 py-2.5 text-left active:bg-muted"
              onClick={() => { setOpenId(c.id); setContacts(contacts.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x))); }}>
              <KktAvatar src={c.avatar} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[15px] truncate">{c.name}</div>
                <div className="text-[13px] text-muted-foreground truncate">
                  {last ? (last.type === "image" ? L.photo : messageText(last, lang)) : ""}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 self-start pt-1">
                <span className="text-[11px] text-muted-foreground">{listTime(last)}</span>
                {c.unread > 0 && <span className="kkt-badge">{c.unread}</span>}
              </div>
            </button>
          ))}
        </div>
        {addingContact && (
          <div className="absolute inset-0 z-30 bg-foreground/30 flex items-end" onClick={() => setAddingContact(false)}>
            <form className="sheet space-y-3" onClick={(e) => e.stopPropagation()} onSubmit={(e) => {
              e.preventDefault();
              const name = String(new FormData(e.currentTarget).get("name") || "").trim();
              if (name) setContacts([...contacts, { id: uid(), name, avatar: "", status: "", unread: 0 }]);
              setAddingContact(false);
            }}>
              <Field label={tr(lang, { en: "Contact name", ko: "친구 이름", zh: "联系人名称" })}><input name="name" className="sheet-input" autoFocus /></Field>
              <button className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground">{L.save}</button>
            </form>
          </div>
        )}
      </div>
    );
  }

  const thread = sortMsgs(msgs.filter((m) => m.contactId === open.id));
  if (call) return <Call contact={open} lang={lang} incoming={call === "incoming"} onClose={() => setCall(null)} />;
  const startEdit = () => { editIds.current = new Set(thread.map((m) => m.id)); setDraft(thread.map((m) => ({ ...m }))); setDraftC({ ...open }); setEditing(true); };
  const save = () => {
    setMsgs((current) => [...current.filter((m) => m.contactId !== open.id || !editIds.current.has(m.id)), ...draft.map((m, i) => ({ ...m, order: i }))]);
    if (draftC) setContacts((current) => current.map((c) => (c.id === draftC.id ? { ...draftC, unread: c.unread } : c)));
    setEditing(false);
  };
  const upd = (id: string, p: Partial<Msg>) => setDraft(draft.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= draft.length) return;
    const a = [...draft];
    const x = a[i], y = a[j];
    if (!x || !y) return;
    a[i] = { ...y, date: x.date, time: x.time };
    a[j] = { ...x, date: y.date, time: y.time };
    setDraft(a);
  };
  const add = (type: MsgType) => {
    const last = draft.at(-1);
    setDraft([...draft, { id: uid(), contactId: open.id, sender: "me", type, ko: type === "date" ? "" : "", zh: "", en: "", date: last?.date ?? TODAY, time: last?.time ?? "12:00", order: draft.length, image: "" }]);
  };

  if (editing && draftC)
    return (
      <div className="app-page bg-background">
        <TopBar title={L.edit} left={<span />} right={<span />} />
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="edit-card space-y-2">
            <div className="flex items-center gap-3"><KktAvatar src={draftC.avatar} size={48} />
              <div className="flex-1 space-y-2">
                <input className="sheet-input" value={draftC.name} onChange={(e) => setDraftC({ ...draftC, name: e.target.value })} />
                <input className="sheet-input" placeholder={tr(lang, { en: "Status message", ko: "상태메시지", zh: "状态消息" })} value={draftC.status} onChange={(e) => setDraftC({ ...draftC, status: e.target.value })} />
              </div>
            </div>
            <ImageField label={tr(lang, { en: "Profile photo", ko: "프로필 사진", zh: "头像" })} value={draftC.avatar} onChange={(v) => setDraftC({ ...draftC, avatar: v })} />
          </div>
          {draft.map((m, i) => (
            <div key={m.id} className="edit-card space-y-2">
              <div className="flex gap-2 flex-wrap items-center">
                <select className="edit-select" value={m.sender} onChange={(e) => upd(m.id, { sender: e.target.value as Msg["sender"] })}>
                  <option value="me">{tr(lang, { en: "Me (Sungchan)", ko: "나 (성찬)", zh: "我（成灿）" })}</option>
                  <option value="them">{draftC.name}</option>
                </select>
                <select className="edit-select" value={m.type} onChange={(e) => upd(m.id, { type: e.target.value as MsgType })}>
                  <option value="text">{tr(lang, { en: "Text", ko: "텍스트", zh: "文字" })}</option>
                  <option value="image">{tr(lang, { en: "Image", ko: "이미지", zh: "图片" })}</option>
                  <option value="system">{tr(lang, { en: "System", ko: "시스템", zh: "系统提示" })}</option>
                  <option value="date">{tr(lang, { en: "Date divider", ko: "날짜 구분선", zh: "日期分隔线" })}</option>
                </select>
                <div className="ml-auto flex gap-1">
                  <button className="edit-chip" onClick={() => move(i, -1)}>↑</button>
                  <button className="edit-chip" onClick={() => move(i, 1)}>↓</button>
                  <button className="edit-chip text-destructive" onClick={() => { if (confirmDelete(lang)) setDraft(draft.filter((x) => x.id !== m.id)); }}>🗑</button>
                </div>
              </div>
              <div className="flex gap-2">
                <input type="date" className="edit-select flex-1" value={m.date} onChange={(e) => upd(m.id, { date: e.target.value })} />
                <input type="time" className="edit-select" value={m.time} onChange={(e) => upd(m.id, { time: e.target.value })} />
              </div>
              {m.type === "image" ? (
                <ImageField label={tr(lang, { en: "Choose image", ko: "이미지 선택", zh: "选择图片" })} value={m.image} onChange={(v) => upd(m.id, { image: v })} />
              ) : null}
              {m.type !== "date" && (
                <>
                  {m.originalText !== undefined && <Field label={tr(lang, { en: "Original message", ko: "원문", zh: "消息原文" })}><textarea className="sheet-input" rows={2} value={m.originalText} onChange={(e) => upd(m.id, { originalText: e.target.value })} /></Field>}
                  <textarea className="sheet-input" rows={2} placeholder="한국어" value={m.ko} onChange={(e) => upd(m.id, { ko: e.target.value })} />
                  <textarea className="sheet-input" rows={2} placeholder="简体中文" value={m.zh} onChange={(e) => upd(m.id, { zh: e.target.value })} />
                  <textarea className="sheet-input" rows={2} placeholder="English" value={m.en ?? ""} onChange={(e) => upd(m.id, { en: e.target.value })} />
                </>
              )}
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2 pb-4">
            <button className="edit-chip" onClick={() => add("text")}>＋ {tr(lang, { en: "Message", ko: "메시지", zh: "消息" })}</button>
            <button className="edit-chip" onClick={() => add("image")}>＋ {tr(lang, { en: "Image", ko: "이미지", zh: "图片" })}</button>
            <button className="edit-chip" onClick={() => add("date")}>＋ {tr(lang, { en: "Divider", ko: "구분선", zh: "分隔线" })}</button>
          </div>
        </div>
        <EditBar onSave={save} onCancel={() => setEditing(false)} save={L.save} cancel={L.cancel} />
      </div>
    );

  let lastDate = "";
  return (
    <div className="app-page kkt-chat-bg">
      <TopBar className="kkt-chat-top" left={<BackBtn onClick={() => setOpenId(null)} />} title={<span className="kkt-contact-title">{open.name}</span>}
        right={<>
          <Button variant="ghost" size="icon" aria-label={label(lang, "search")} onClick={() => setSearching(!searching)}><Search size={21} /></Button>
          <Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Chat menu", ko: "채팅 메뉴", zh: "聊天菜单" })} aria-expanded={menu} onClick={() => setMenu(!menu)}><Menu size={22} /></Button>
        </>} />
      {searching && <div className="kkt-search"><input className="kkt-compose" aria-label={tr(lang, { en: "Search messages", ko: "메시지 검색", zh: "搜索聊天记录" })} placeholder={label(lang, "search")} value={search} onChange={(e) => setSearch(e.target.value)} /><Button variant="ghost" size="icon" aria-label={L.cancel} onClick={() => { setSearching(false); setSearch(""); }}><X /></Button></div>}
      {menu && <div className="kkt-menu-sheet"><Button variant="ghost" onClick={() => { setMenu(false); startEdit(); }}>{L.edit}</Button><Button variant="ghost" onClick={() => { setMenu(false); setCall("outgoing"); }}><Phone />{tr(lang, { en: "Call", ko: "전화", zh: "拨打电话" })}</Button><Button variant="ghost" onClick={() => { setMenu(false); setCall("incoming"); }}><PhoneIncoming />{tr(lang, { en: "Simulate incoming call", ko: "모의 전화 수신", zh: "模拟来电" })}</Button></div>}
      <div className="kkt-thread flex-1 overflow-y-auto" ref={scroll}>
        {thread.filter((m) => !searching || !search || messageText(m, lang).toLowerCase().includes(search.toLowerCase())).map((m, i) => {
          const parts = [];
          if (m.date !== lastDate) {
            lastDate = m.date;
            parts.push(<div key={m.id + "d"} className="kkt-date">{koDate(m.date, lang)}</div>);
          }
          const text = messageText(m, lang);
          if (m.type === "date") { /* The date heading above already displays this divider. */ }
          else if (m.type === "system") parts.push(<div key={m.id} className="kkt-system">{text}</div>);
          else {
            const mine = m.sender === "me";
            const prev = thread[i - 1];
            const head = !mine && (!prev || prev.sender !== "them" || prev.date !== m.date || prev.type === "system");
            const content = m.type === "image"
              ? <div className={`kkt-image-bubble ${mine ? "kkt-image-mine" : ""}`}><img src={resolveImg(m.image)} alt="" className="kkt-img" loading="lazy" />{(m.originalText || m[lang]) && <p className="text-sm whitespace-pre-wrap">{text}</p>}</div>
              : <div className={mine ? "kkt-bubble-me" : "kkt-bubble-them"}>{text}</div>;
            parts.push(
              <div key={m.id} className={`kkt-message-row flex gap-2 ${mine ? "justify-end" : ""}`}>
                {!mine && <div className="w-9 shrink-0">{head && <KktAvatar src={open.avatar} size={34} />}</div>}
                <div className={`kkt-message-body flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  {head && <span className="text-[12px] mb-0.5 opacity-80">{open.name}</span>}
                  <div className={`flex items-end gap-1 ${mine ? "flex-row-reverse" : ""}`}>
                    {content}
                    <span className="kkt-message-time">{mine && m.originalText !== undefined && !m.read && <span className="kkt-read-count">1</span>}{fmt12(m.time, lang)}</span>
                  </div>
                </div>
              </div>,
            );
          }
          return parts;
        })}
        {typing && <div className="flex gap-2 items-center py-2" role="status" aria-label={tr(lang, { en: "Typing", ko: "입력 중", zh: "正在输入" })}><KktAvatar src={open.avatar} size={28} /><span className="typing-dots"><i /><i /><i /></span></div>}
      </div>
      {emoji && <div className="kkt-emoji-panel">{["😊", "ㅋㅋ", "❤️", "👍", "😭", "😂"].map((face) => <Button variant="ghost" key={face} onClick={() => { setCompose((text) => text + face); setEmoji(false); }}>{face}</Button>)}</div>}
      <form className="kkt-input" onSubmit={(event) => {
        event.preventDefault();
        const text = compose.trim();
        if (!text) return;
        sendChat("kkt", open.id, text, lang);
        setCompose("");
      }}>
        <Button type="button" variant="ghost" size="icon" aria-label={tr(lang, { en: "Send photo", ko: "사진 보내기", zh: "发送图片" })} onClick={() => upload.current?.click()}><Plus /></Button>
        <input ref={upload} type="file" accept="image/*" className="hidden" onChange={async (e) => { const input = e.currentTarget; const file = input.files?.[0]; try { if (file) { const image = await fileToDataUrl(file); sendChat("kkt", open.id, compose.trim(), lang, Date.now(), image); setCompose(""); } } catch { alert(tr(lang, { en: "Could not send photo", ko: "사진을 보낼 수 없습니다", zh: "图片未发送，请重试" })); } finally { input.value = ""; } }} />
        <input aria-label={tr(lang, { en: "Message", ko: "메시지 입력", zh: "输入消息" })} placeholder={tr(lang, { en: "Message", ko: "메시지 입력", zh: "输入消息" })} className="kkt-compose" value={compose} onChange={(event) => setCompose(event.target.value)} />
        <Button type="button" variant="ghost" size="icon" aria-label={tr(lang, { en: "Emoji", ko: "이모티콘", zh: "表情" })} aria-expanded={emoji} onClick={() => setEmoji(!emoji)}><Smile size={21} /></Button>
        <Button type="submit" size="icon" disabled={!compose.trim()} aria-label={tr(lang, { en: "Send message", ko: "메시지 보내기", zh: "发送消息" })} className="kkt-send"><Send size={17} /></Button>
      </form>
    </div>
  );
}
