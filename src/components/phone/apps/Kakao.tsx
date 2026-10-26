import { useState } from "react";
import { type AppProps, tr } from "../i18n";
import { CONTACTS, MESSAGES, type Contact, type Msg, type MsgType } from "../story";
import { uid, usePersist } from "../store";
import { BackBtn, EditBar, Field, ImageField, KktAvatar, TopBar, resolveImg } from "../ui";

const TODAY = "2026-10-26";
const sortMsgs = (a: Msg[]) =>
  [...a].sort((x, y) => x.date.localeCompare(y.date) || x.time.localeCompare(y.time) || x.order - y.order);

const koDate = (d: string, zh: boolean) => {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString(zh ? "zh-CN" : "ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
};
const listTime = (m?: Msg) => (!m ? "" : m.date === TODAY ? m.time : m.date.startsWith("2026") ? m.date.slice(5).replace("-", ".") : m.date.replaceAll("-", "."));
const fmt12 = (t: string, zh: boolean) => {
  const [h, mm] = t.split(":").map(Number);
  const pm = h >= 12;
  return `${zh ? (pm ? "下午" : "上午") : pm ? "오후" : "오전"} ${h % 12 || 12}:${String(mm).padStart(2, "0")}`;
};

export default function Kakao({ lang, onHome }: AppProps) {
  const [contacts, setContacts] = usePersist<Contact[]>("kkt-contacts-v1", CONTACTS);
  const [msgs, setMsgs] = usePersist<Msg[]>("kkt-msgs-v1", MESSAGES);
  const [cl, setCl] = usePersist<"ko" | "zh">("kkt-lang", "ko");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Msg[]>([]);
  const [draftC, setDraftC] = useState<Contact | null>(null);
  const [addingContact, setAddingContact] = useState(false);
  const zh = cl === "zh";

  const L = {
    chats: tr(lang, { en: "Chats", ko: "채팅", zh: "聊天" }),
    edit: tr(lang, { en: "Edit", ko: "편집", zh: "编辑" }),
    save: tr(lang, { en: "Save", ko: "저장", zh: "保存" }),
    cancel: tr(lang, { en: "Cancel", ko: "취소", zh: "取消" }),
    photo: zh ? "照片" : "사진",
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
                  {last ? (last.type === "image" ? L.photo : (zh ? last.zh || last.ko : last.ko)) : ""}
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
  const startEdit = () => { setDraft(thread.map((m) => ({ ...m }))); setDraftC({ ...open }); setEditing(true); };
  const save = () => {
    const keep = msgs.filter((m) => m.contactId !== open.id);
    setMsgs([...keep, ...draft.map((m, i) => ({ ...m, order: i }))].map((m, i) => ({ ...m, order: m.contactId === open.id ? m.order : i + 100000 })));
    if (draftC) setContacts(contacts.map((c) => (c.id === draftC.id ? draftC : c)));
    setEditing(false);
  };
  const upd = (id: string, p: Partial<Msg>) => setDraft(draft.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= draft.length) return;
    const a = [...draft];
    const [x, y] = [a[i], a[j]];
    a[i] = { ...y, date: x.date, time: x.time };
    a[j] = { ...x, date: y.date, time: y.time };
    setDraft(a);
  };
  const add = (type: MsgType) => {
    const last = draft.at(-1);
    setDraft([...draft, { id: uid(), contactId: open.id, sender: "me", type, ko: type === "date" ? "" : "", zh: "", date: last?.date ?? TODAY, time: last?.time ?? "12:00", order: draft.length, image: "" }]);
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
                  <button className="edit-chip text-destructive" onClick={() => setDraft(draft.filter((x) => x.id !== m.id))}>🗑</button>
                </div>
              </div>
              <div className="flex gap-2">
                <input type="date" className="edit-select flex-1" value={m.date} onChange={(e) => upd(m.id, { date: e.target.value })} />
                <input type="time" className="edit-select" value={m.time} onChange={(e) => upd(m.id, { time: e.target.value })} />
              </div>
              {m.type === "image" ? (
                <ImageField label={tr(lang, { en: "Choose image", ko: "이미지 선택", zh: "选择图片" })} value={m.image} onChange={(v) => upd(m.id, { image: v })} />
              ) : (
                <>
                  <textarea className="sheet-input" rows={2} placeholder="한국어" value={m.ko} onChange={(e) => upd(m.id, { ko: e.target.value })} />
                  <textarea className="sheet-input" rows={2} placeholder="中文翻译" value={m.zh} onChange={(e) => upd(m.id, { zh: e.target.value })} />
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
      <TopBar className="kkt-chat-top" left={<BackBtn onClick={() => setOpenId(null)} />} title={open.name}
        right={<>
          <button className="text-xs kkt-lang" onClick={() => setCl(zh ? "ko" : "zh")}>{zh ? "한국어" : "中文翻译"}</button>
          <button className="text-sm font-medium" onClick={startEdit}>{L.edit}</button>
        </>} />
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5" ref={(el) => { if (el && !el.dataset.s) { el.scrollTop = el.scrollHeight; el.dataset.s = "1"; } }}>
        {thread.map((m, i) => {
          const parts = [];
          if (m.date !== lastDate) {
            lastDate = m.date;
            parts.push(<div key={m.id + "d"} className="kkt-date">{koDate(m.date, zh)}</div>);
          }
          const text = zh ? m.zh : m.ko;
          if (m.type === "date") parts.push(<div key={m.id} className="kkt-date">{text || (zh ? "暂无翻译" : "")}</div>);
          else if (m.type === "system") parts.push(<div key={m.id} className="kkt-system">{text || "暂无翻译"}</div>);
          else {
            const mine = m.sender === "me";
            const prev = thread[i - 1];
            const head = !mine && (!prev || prev.sender !== "them" || prev.date !== m.date || prev.type === "system");
            const content = m.type === "image"
              ? <img src={resolveImg(m.image)} alt="" className="kkt-img" loading="lazy" />
              : <div className={mine ? "kkt-bubble-me" : "kkt-bubble-them"}>{text || <span className="opacity-50">暂无翻译</span>}</div>;
            parts.push(
              <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : ""}`}>
                {!mine && <div className="w-9 shrink-0">{head && <KktAvatar src={open.avatar} size={36} />}</div>}
                <div className={`flex flex-col max-w-[72%] ${mine ? "items-end" : "items-start"}`}>
                  {head && <span className="text-[12px] mb-0.5 opacity-80">{open.name}</span>}
                  <div className={`flex items-end gap-1 ${mine ? "flex-row-reverse" : ""}`}>
                    {content}
                    <span className="text-[10px] opacity-60 shrink-0">{fmt12(m.time, zh)}</span>
                  </div>
                </div>
              </div>,
            );
          }
          return parts;
        })}
      </div>
      <div className="kkt-input"><div className="flex-1 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">{zh ? "输入消息" : "메시지 입력"}</div><span className="kkt-send">#</span></div>
    </div>
  );
}
