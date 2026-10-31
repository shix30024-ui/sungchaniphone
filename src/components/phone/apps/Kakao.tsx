import { useEffect, useRef, useState } from "react";
import { setActiveChat } from "../live";
import { type AppProps, tr } from "../i18n";
import { CONTACTS, MESSAGES, type Contact, type Msg, type MsgType } from "../story";
import { uid, usePersist } from "../store";
import { PhotoImg } from "../photo-db";
import { moveKktImagesToDb } from "../kkt-images";
import { BackBtn, EditBar, Field, ImageField, KktAvatar, TopBar } from "../ui";
import { useOwner } from "../owner";
import { Button } from "@/components/ui/button";
import { Send, Phone, PhoneIncoming, Search, Menu, Plus, Smile, X, Users, MessageCircle, MessageCirclePlus, Settings2, ShoppingBag, MoreHorizontal, SquarePlus, CalendarDays, Music } from "lucide-react";
import { fileToDataUrl } from "../store";
import Call from "./Call";
import { type PendingReply, QUEUE_KEY, sendChat } from "../conversation";
import { STORY_DATE, messageText, sortMessages } from "../chronology";
import { confirmDelete, label, localeFor } from "../labels";
import { completeTranslations } from "../translations";
import { ANTON_PROGRESS_KEY, EMPTY_PROGRESS, fixedFlow, acknowledgeFixedNode, temporaryReply, withTemporaryReplies, readTemporaryReplies, writeTemporaryReplies, temporaryIncoming, type FixedProgress, type TemporaryReply } from "../fixed-conversation";
import { ANTON_AFTER_REASSURANCE, FIRST_PLAYER_REPLIES, FINAL_PLAYER_REPLIES, makeAntonSceneMessage, makeAntonSceneSystem, readAntonScene, updateAntonScene, type AntonSceneState } from "../anton-scene";

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

const FREE_CHAT_REPLIES = [
  { ko: "그래. 마음대로 해.", zh: "行啊，随你。", en: "Fine. Do whatever you want." },
  { ko: "굳이 나한테 설명 안 해도 돼.", zh: "不用特意跟我解释。", en: "You don't have to explain it to me." },
  { ko: "아까는 아니라며.", zh: "你刚刚不是还说不是吗？", en: "You said that wasn't the case earlier." },
  { ko: "됐어. 나 지금 연습해야 돼.", zh: "算了，我现在要练习。", en: "Whatever. I have practice now." },
  { ko: "형은 진짜 아무렇지도 않나 봐.", zh: "哥看起来是真的一点都不在意啊。", en: "You really don't seem bothered at all." },
  { ko: "나중에 얘기해.", zh: "之后再说吧。", en: "We'll talk later." },
] as const;

export default function Kakao({ lang, onHome, initialChat }: AppProps & { initialChat?: string | null }) {
  const [contacts, setContacts] = usePersist<Contact[]>("kkt-contacts-v1", CONTACTS);
  const [msgs, setMsgs] = usePersist<Msg[]>("kkt-msgs-v1", MESSAGES, completeTranslations);
  // Merge bundled story additions after both local and shared saves hydrate.
  // Shared snapshots can arrive after mount, so rerun only on that explicit refresh.
  const mergeStorySeeds = () => {
    setContacts((current) => {
      const byId = new Map(current.map((contact) => [contact.id, contact]));
      for (const seed of CONTACTS) {
        const existing = byId.get(seed.id);
        if (!existing) byId.set(seed.id, seed);
        else if (seed.id === "anton") byId.set(seed.id, { ...existing, name: seed.name, pinned: true });
      }
      return [...byId.values()];
    });
    setMsgs((current) => {
      // Bundled seed IDs are positional (m1, m2, ...), so after story edits
      // old saved seeds can survive under now-obsolete IDs and appear duplicated.
      // Remove all bundled-style seed rows, purge the deleted dates, then rebuild
      // from the current story data while preserving player-authored custom IDs.
      const kept = current.filter((message) => {
        if (/^m\d+$/.test(message.id)) return false;
        if (message.date === "2024-03-20" || message.date === "2026-10-26" || message.date === "2026-10-27") return false;
        // Remove obsolete 2023-09-13 birthday reply copies from older saved snapshots.
        if (message.contactId === "anton" && message.date === "2023-09-13" && message.sender === "me" && message.time === "00:09") return false;
        // Move non-Anton, non-Seoyun everyday chats off Anton’s birthday date in older saves.
        if (message.date === "2026-03-21" && !["anton", "seoyun"].includes(message.contactId)) return false;
        return true;
      });
      const merged = [...kept, ...MESSAGES];
      // Shared snapshots and older local saves may contain repeated copies with
      // different IDs. Deduplicate by message content and timestamp for every chat.
      const seen = new Set<string>();
      return merged.filter((message) => {
        const signature = JSON.stringify([
          message.contactId, message.date, message.time, message.sender,
          message.type, message.ko, message.zh, message.en ?? "", message.image ?? "",
          message.originalText ?? "", message.speaker ?? "",
        ]);
        if (seen.has(signature)) return false;
        seen.add(signature);
        return true;
      });
    });
  };
  useEffect(() => {
    mergeStorySeeds();
    window.addEventListener("phone-shared-refresh", mergeStorySeeds);
    return () => window.removeEventListener("phone-shared-refresh", mergeStorySeeds);
  // The migration intentionally uses the latest persisted value through usePersist setters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [openId, setOpenId] = useState<string | null>(initialChat ?? null);
  // Temporary replies live in page memory (fixed-conversation module), so they
  // survive leaving/re-entering the chat but vanish on refresh or close.
  const [temporary, setTemporaryState] = useState<TemporaryReply[]>(() => readTemporaryReplies("anton"));
  const setTemporary = (updater: (old: TemporaryReply[]) => TemporaryReply[]) =>
    setTemporaryState((old) => {
      const next = updater(old);
      writeTemporaryReplies("anton", next);
      window.dispatchEvent(new CustomEvent("phone-store", { detail: "kkt-temporary" }));
      return next;
    });
  const [scene, setScene] = useState<AntonSceneState>(() => readAntonScene());
  const patchScene = (patch: Partial<AntonSceneState>) => setScene(updateAntonScene(patch));
  const [progress] = usePersist<FixedProgress>(ANTON_PROGRESS_KEY, EMPTY_PROGRESS);
  // One-time: move large chat images out of the small browser storage. Text and order are untouched.
  useEffect(() => { void moveKktImagesToDb(); }, []);
  useEffect(() => { setActiveChat(openId); return () => setActiveChat(null); }, [openId]);
  // Opening Anton’s chat clears the temporary scripted-message unread state too.
  useEffect(() => {
    if (openId === "anton" && temporary.some((reply) => reply.message.sender === "them" && !reply.message.read)) {
      setTemporary((old) => old.map((reply) => reply.message.sender === "them" ? { ...reply, message: { ...reply.message, read: true } } : reply));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);
  // Opening a chat marks it read. Works on the saved copy directly so defaults never overwrite saved edits.
  useEffect(() => {
    if (!openId) return;
    if (msgs.some((message) => message.contactId === openId && message.live && !message.read)) {
      setMsgs((current) => current.map((message) =>
        message.contactId === openId && message.live && !message.read ? { ...message, read: true } : message));
    }
    if (contacts.some((contact) => contact.id === openId && contact.unread > 0)) {
      setContacts((current) => current.map((contact) =>
        contact.id === openId ? { ...contact, unread: 0 } : contact));
    }
  }, [openId, msgs, contacts, setMsgs, setContacts]);
  const [editing, setEditing] = useState(false);
  const owner = useOwner();
  const [draft, setDraft] = useState<Msg[]>([]);
  const [draftC, setDraftC] = useState<Contact | null>(null);
  const [addingContact, setAddingContact] = useState(false);
  const [compose, setCompose] = useState("");
  const [call, setCall] = useState<"outgoing" | "incoming" | null>(null);
  const [menu, setMenu] = useState(false);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [emoji, setEmoji] = useState(false);
  // Leaving the chat keeps temporary replies in page memory; only a page
  // refresh or close clears them. Compose/typing UI state still resets.
  useEffect(() => { setCompose(""); setEmoji(false); setAntonTyping(false); }, [openId, editing, call]);
  const [listTab, setListTab] = useState<"friends" | "chats" | "openchat" | "shopping" | "more">("chats");
  const [listMenu, setListMenu] = useState(false);
  const [gifts, setGifts] = usePersist<{ id: string; title: string }[]>("phone-kkt-gifts-v1", []);
  const [giftDraft, setGiftDraft] = useState<{ id: string; title: string } | null>(null);
  const [listSearch, setListSearch] = useState("");
  const [listSearching, setListSearching] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  const [queue] = usePersist<PendingReply[]>(QUEUE_KEY, []);
  const scroll = useRef<HTMLDivElement>(null);
  const editIds = useRef(new Set<string>());
  const [antonTyping, setAntonTyping] = useState(false);
  const typing = antonTyping || (openId !== "anton" && queue.some((q) => !q.failed && q.channel === "kkt" && q.contactId === openId));
  // Auto-scroll only when opening a chat or when the player is already near
  // the bottom, so scrolling up to read history is never yanked back down.
  const stickBottom = useRef(true);
  useEffect(() => { stickBottom.current = true; }, [openId]);
  useEffect(() => {
    if (scroll.current && stickBottom.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [msgs, openId, typing, editing, temporary, progress]);

  const L = {
    chats: tr(lang, { en: "Chats", ko: "채팅", zh: "聊天" }),
    edit: tr(lang, { en: "Edit", ko: "편집", zh: "编辑" }),
    save: tr(lang, { en: "Save", ko: "저장", zh: "保存" }),
    cancel: tr(lang, { en: "Cancel", ko: "취소", zh: "取消" }),
    photo: label(lang, "photo"),
  };

  // Anton's second set of fixed messages arrives one at a time with a typing indicator.
  useEffect(() => {
    if (openId !== "anton" || scene.phase !== "anton-typing") { setAntonTyping(false); return; }
    const line = ANTON_AFTER_REASSURANCE[scene.antonReplyCount];
    if (!line) { patchScene({ phase: "final-replies" }); setAntonTyping(false); return; }
    setAntonTyping(true);
    const timer = window.setTimeout(() => {
      const base = sortMsgs(msgs.filter((m) => m.contactId === "anton"));
      const anchor = withTemporaryReplies(base, readTemporaryReplies("anton")).at(-1);
      const incoming = makeAntonSceneMessage(line, anchor);
      setTemporary((old) => [...old, incoming]);
      const nextCount = scene.antonReplyCount + 1;
      patchScene({ antonReplyCount: nextCount, phase: nextCount >= ANTON_AFTER_REASSURANCE.length ? "final-replies" : "anton-typing" });
      setAntonTyping(false);
    }, 1100);
    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, scene.phase, scene.antonReplyCount]);

  const displayContacts = contacts;
  const temporaryAntonMessages = temporary.map((reply) => reply.message);
  const unreadForContact = (contactId: string) => Math.max(
    contacts.find((contact) => contact.id === contactId)?.unread || 0,
    msgs.filter((message) => message.contactId === contactId && message.live && !message.read).length,
    contactId === "anton" ? temporaryAntonMessages.filter((message) => message.sender === "them" && !message.read).length : 0,
  );
  const open = displayContacts.find((c) => c.id === openId);

  if (!open) {
    const rows = displayContacts
      .map((c) => {
        const saved = msgs.filter((m) => m.contactId === c.id && m.type !== "date");
        const combined = c.id === "anton" ? [...saved, ...temporaryAntonMessages.filter((m) => m.type !== "date")] : saved;
        return { c, last: sortMsgs(combined).at(-1) };
      })
      .sort((a, b) => Number(!!b.c.pinned) - Number(!!a.c.pinned) || ((b.last?.date ?? "") + (b.last?.time ?? "")).localeCompare((a.last?.date ?? "") + (a.last?.time ?? "")));
    return (
      <div className="app-page bg-background">
        <TopBar className="kkt-list-top" title={listTab === "chats" ? L.chats : listTab === "friends" ? tr(lang, { en: "Friends", ko: "친구", zh: "好友" }) : listTab === "openchat" ? tr(lang, { en: "OpenChat", ko: "오픈채팅", zh: "开放聊天" }) : listTab === "shopping" ? tr(lang, { en: "Shopping", ko: "쇼핑", zh: "购物" }) : tr(lang, { en: "More", ko: "더보기", zh: "更多" })}
          right={<><Button variant="ghost" size="icon" aria-label={label(lang, "search")} onClick={() => setListSearching(!listSearching)}><Search size={22} /></Button>{owner && <Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Add friend", ko: "친구 추가", zh: "添加好友" })} onClick={() => setAddingContact(true)}><MessageCirclePlus size={22} /></Button>}<Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Chat settings", ko: "채팅 설정", zh: "聊天设置" })} onClick={() => setListMenu(!listMenu)}><Settings2 size={22} /></Button></>} />
        {listMenu && <div className="kkt-menu-sheet"><Button variant="ghost" onClick={onHome}>{tr(lang, { en: "Home", ko: "홈", zh: "主屏幕" })}</Button><Button variant="ghost" onClick={() => { setListTab("friends"); setListMenu(false); }}>{tr(lang, { en: "Friends", ko: "친구", zh: "好友" })}</Button>{owner && <Button variant="ghost" onClick={() => { setAddingContact(true); setListMenu(false); }}><Plus />{tr(lang, { en: "Add friend", ko: "친구 추가", zh: "添加好友" })}</Button>}</div>}
        {listSearching && <div className="kkt-search"><input className="kkt-compose" aria-label={tr(lang, { en: "Search chats", ko: "채팅 검색", zh: "搜索聊天" })} placeholder={label(lang, "search")} value={listSearch} onChange={(e) => setListSearch(e.target.value)} /></div>}
        <div className="flex-1 overflow-y-auto">
          {(listTab === "chats" || listTab === "friends" || listTab === "openchat") && rows.filter(({ c, last }) => (listTab !== "openchat" || c.id.startsWith("group")) && (!listSearch || `${c.name} ${last ? messageText(last, lang) : ""}`.toLowerCase().includes(listSearch.toLowerCase()))).map(({ c, last }) => (
            <Button variant="ghost" key={c.id} className="kkt-chat-list-row"
              onClick={() => { setOpenId(c.id); setContacts((current) => current.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x))); }}>
              <KktAvatar src={c.avatar} size={48} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[15px] truncate">{c.name}</div>
                <div className="text-[13px] text-muted-foreground truncate">
                  {listTab === "friends" ? c.status : last ? (last.type === "image" ? L.photo : messageText(last, lang)) : ""}
                </div>
              </div>
              {listTab === "chats" && <div className="flex flex-col items-end gap-1 self-start pt-1">
                <span className="text-[11px] text-muted-foreground">{listTime(last)}</span>
                {unreadForContact(c.id) > 0 && <span className="kkt-badge">{unreadForContact(c.id)}</span>}
              </div>}
            </Button>
          ))}
          {listTab === "more" && <div className="p-5 space-y-4"><Button variant="outline" className="w-full justify-start" onClick={() => setListTab("friends")}><Users />{tr(lang, { en: "Friends", ko: "친구", zh: "好友" })}</Button><Button variant="outline" className="w-full justify-start" onClick={onHome}>{tr(lang, { en: "Home", ko: "홈", zh: "主屏幕" })}</Button></div>}
          {listTab === "shopping" && <div className="p-5 space-y-3">{owner && <Button variant="outline" onClick={() => setGiftDraft({ id: uid(), title: "" })}><Plus />{tr(lang, { en: "Gift", ko: "선물", zh: "礼物" })}</Button>}{gifts.map((gift) => <Button key={gift.id} variant="ghost" className="w-full justify-start" onClick={() => owner && setGiftDraft({ ...gift })}><ShoppingBag />{gift.title}</Button>)}{giftDraft && <div className="space-y-2"><input className="sheet-input" aria-label={tr(lang, { en: "Gift name", ko: "선물 이름", zh: "礼物名称" })} value={giftDraft.title} onChange={(e) => setGiftDraft({ ...giftDraft, title: e.target.value })} /><EditBar save={L.save} cancel={L.cancel} onCancel={() => setGiftDraft(null)} onSave={() => { if (!giftDraft.title.trim()) return; setGifts((old) => old.some((g) => g.id === giftDraft.id) ? old.map((g) => g.id === giftDraft.id ? giftDraft : g) : [...old, giftDraft]); setGiftDraft(null); }} /><Button variant="ghost" className="text-destructive" onClick={() => { if (confirmDelete(lang)) { setGifts((old) => old.filter((g) => g.id !== giftDraft.id)); setGiftDraft(null); } }}>{label(lang, "delete")}</Button></div>}</div>}
        </div>
        <nav className="kkt-bottom-nav">
          <Button variant="ghost" aria-label={tr(lang, { en: "Friends", ko: "친구", zh: "好友" })} aria-pressed={listTab === "friends"} onClick={() => setListTab("friends")}><Users size={23} /><span>{tr(lang, { en: "Friends", ko: "친구", zh: "好友" })}</span></Button>
          <Button variant="ghost" aria-label={L.chats} aria-pressed={listTab === "chats"} onClick={() => setListTab("chats")}><MessageCircle size={23} /><span>{L.chats}</span></Button>
          <Button variant="ghost" aria-pressed={listTab === "openchat"} onClick={() => setListTab("openchat")}><Smile size={23} /><span>{tr(lang, { en: "OpenChat", ko: "오픈채팅", zh: "开放聊天" })}</span></Button>
          <Button variant="ghost" aria-pressed={listTab === "shopping"} onClick={() => setListTab("shopping")}><ShoppingBag size={23} /><span>{tr(lang, { en: "Shopping", ko: "쇼핑", zh: "购物" })}</span></Button>
          <Button variant="ghost" aria-pressed={listTab === "more"} onClick={() => setListTab("more")}><MoreHorizontal size={23} /><span>{tr(lang, { en: "More", ko: "더보기", zh: "更多" })}</span></Button>
        </nav>
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

  const savedThread = sortMsgs(msgs.filter((m) => m.contactId === open.id));
  const flow = fixedFlow(savedThread, progress);
  const fixedThread = flow.visible;
  const thread = open.id === "anton" ? withTemporaryReplies(fixedThread, temporary) : fixedThread;
  const send = (text: string, image?: string) => {
    if (open.id !== "anton") { sendChat("kkt", open.id, text, lang, Date.now(), image); return; }
    const visibleThread = withTemporaryReplies(fixedThread, readTemporaryReplies("anton"));
    const playerMsg = temporaryReply(text, lang, visibleThread.at(-1), image);
    setTemporary((old) => [...old, playerMsg]);
    if (flow.waiting) acknowledgeFixedNode(flow.waiting.id);
    const current = readAntonScene();
    if (current.phase === "first-replies") {
      const count = current.firstReplyCount + 1;
      patchScene({ firstReplyCount: count, phase: count >= FIRST_PLAYER_REPLIES.length ? "choose-ending" : "first-replies" });
    } else if (current.phase === "final-replies") {
      const count = current.finalReplyCount + 1;
      patchScene({ finalReplyCount: count, phase: count >= FINAL_PLAYER_REPLIES.length ? "done" : "final-replies" });
    } else if (current.phase === "done" && current.ending === "not-blocked") {
      const count = current.freeMessageCount + 1;
      patchScene({ freeMessageCount: count });
      // Keep Anton's replies sparse: one delayed, restrained response for every
      // three messages the player sends in the free-chat phase.
      if (count % 3 === 0) {
        const reply = FREE_CHAT_REPLIES[(Math.floor(count / 3) - 1) % FREE_CHAT_REPLIES.length];
        const delay = 18000 + Math.floor(Math.random() * 10000);
        window.setTimeout(() => {
          setAntonTyping(true);
          window.setTimeout(() => {
            const latest = readTemporaryReplies("anton");
            const anchor = latest.at(-1)?.message ?? playerMsg.message;
            const incoming = temporaryIncoming(reply, anchor);
            const next = [...latest, incoming];
            writeTemporaryReplies("anton", next);
            setTemporaryState(next);
            setAntonTyping(false);
          }, 1300);
        }, delay);
      }
    }
  };

  const chooseEnding = (ending: "blocked" | "not-blocked") => {
    const visibleThread = withTemporaryReplies(fixedThread, readTemporaryReplies("anton"));
    const anchor = visibleThread.at(-1);
    if (ending === "blocked") {
      setTemporary((old) => [...old, makeAntonSceneSystem(tr(lang, { en: "You have been blocked.", ko: "차단되었습니다.", zh: "已被拉黑" }), lang, anchor)]);
      patchScene({ ending, phase: "blocked" });
    } else {
      patchScene({ ending, phase: "anton-typing", antonReplyCount: 0 });
    }
  };
  if (call) return <Call contact={open} lang={lang} incoming={call === "incoming"} onClose={() => setCall(null)} />;
  const startEdit = () => { editIds.current = new Set(savedThread.map((m) => m.id)); setDraft(savedThread.map((m) => ({ ...m }))); setDraftC({ ...open }); setEditing(true); };
  const save = () => {
    const ok = setMsgs((current) => [...current.filter((m) => m.contactId !== open.id || !editIds.current.has(m.id)), ...draft.map((m, i) => ({ ...m, order: i }))]);
    // Keep the editor open when saving fails so unsaved edits are never lost.
    if (!ok) return;
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
                  <option value="music">{tr(lang, { en: "Music share", ko: "음악 공유", zh: "音乐分享" })}</option>
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
              {open.id === "anton" && m.sender === "them" && (m.type === "text" || m.type === "image") && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={m.requiresReply ?? false} onChange={(e) => upd(m.id, { requiresReply: e.target.checked })} />{tr(lang, { en: "Wait for player reply", ko: "플레이어 답장 기다리기", zh: "等待玩家回复" })}</label>}
              {m.type === "image" ? (
                <ImageField label={tr(lang, { en: "Choose image", ko: "이미지 선택", zh: "选择图片" })} value={m.image} large onChange={(v) => upd(m.id, { image: v })} />
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

  const suggestedReply = () => {
    const current = readAntonScene();
    if (open.id !== "anton") return undefined;
    if (current.phase === "first-replies") return FIRST_PLAYER_REPLIES[current.firstReplyCount]?.[lang];
    if (current.phase === "final-replies") return FINAL_PLAYER_REPLIES[current.finalReplyCount]?.[lang];
    return undefined;
  };

  const fillSuggestedReply = () => {
    if (compose.trim()) return;
    const suggested = suggestedReply();
    if (suggested) setCompose(suggested);
  };

  const submitMessage = () => {
    const text = compose.trim();
    if (!text) return;
    send(text);
    setCompose("");
  };

  let lastDate = "";
  return (
    <div className="app-page kkt-chat-bg">
      <TopBar className="kkt-chat-top" left={<BackBtn onClick={() => setOpenId(null)} />} title={<span className="kkt-contact-title">{open.name}</span>}
        right={<>
          <Button variant="ghost" size="icon" aria-label={label(lang, "search")} onClick={() => setSearching(!searching)}><Search size={21} /></Button>
          <Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Chat menu", ko: "채팅 메뉴", zh: "聊天菜单" })} aria-expanded={menu} onClick={() => setMenu(!menu)}><Menu size={22} /></Button>
        </>} />
      {searching && <div className="kkt-search"><input className="kkt-compose" aria-label={tr(lang, { en: "Search messages", ko: "메시지 검색", zh: "搜索聊天记录" })} placeholder={label(lang, "search")} value={search} onChange={(e) => setSearch(e.target.value)} /><Button variant="ghost" size="icon" aria-label={L.cancel} onClick={() => { setSearching(false); setSearch(""); }}><X /></Button></div>}
      {menu && <div className="kkt-menu-sheet">{owner && <Button variant="ghost" onClick={() => { setMenu(false); startEdit(); }}>{L.edit}</Button>}<Button variant="ghost" onClick={() => { setMenu(false); setCall("outgoing"); }}><Phone />{tr(lang, { en: "Call", ko: "전화", zh: "拨打电话" })}</Button><Button variant="ghost" onClick={() => { setMenu(false); setCall("incoming"); }}><PhoneIncoming />{tr(lang, { en: "Simulate incoming call", ko: "모의 전화 수신", zh: "模拟来电" })}</Button></div>}
      <div className="kkt-thread flex-1 overflow-y-auto" ref={scroll}
        onScroll={(e) => { const el = e.currentTarget; stickBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}>
        {thread.filter((m) => !searching || !search || messageText(m, lang).toLowerCase().includes(search.toLowerCase())).map((m, i) => {
          const parts = [];
          if (m.date !== lastDate) {
            lastDate = m.date;
            parts.push(<div key={m.id + "d"} className="kkt-date"><span><CalendarDays size={12} />{koDate(m.date, lang)}</span></div>);
          }
          const text = messageText(m, lang);
          const mine = m.sender === "me";
          const prev = thread[i - 1];
          const head = !mine && (!prev || prev.sender !== "them" || prev.date !== m.date || prev.type === "system" || (open.id === "group-family" && prev.speaker !== m.speaker));
          if (m.type === "date") { /* The date heading above already displays this divider. */ }
          else if (m.type === "system" && text.includes("통화")) parts.push(
            <div key={m.id} className="flex justify-center py-2">
              <div className="flex items-center gap-3 rounded-2xl bg-card/90 border px-4 py-3 shadow-sm">
                <div className="rounded-full bg-primary/10 p-2"><Phone size={18} /></div>
                <div className="text-sm"><div className="font-medium">{text}</div><div className="text-xs opacity-60">{fmt12(m.time, lang)}</div></div>
              </div>
            </div>
          );
          else if (m.type === "system") parts.push(<div key={m.id} className="kkt-system">{text}</div>);
          else if (m.type === "music") parts.push(
            <div key={m.id} className={`kkt-message-row flex gap-2 ${m.sender === "me" ? "justify-end" : ""}`}>
              {m.sender === "them" && <div className="w-10 shrink-0">{head && <KktAvatar src={open.avatar} size={40} />}</div>}
              <div className={`kkt-message-body flex flex-col ${m.sender === "me" ? "items-end" : "items-start"}`}>
                {head && <span className="text-[12px] mb-0.5 opacity-80">{open.name}</span>}
                <div className="flex items-end gap-1">
                  <div className="w-[238px] overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
                    <div className="flex items-center gap-3 p-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-200 to-orange-400 text-white"><Music size={25} /></div>
                      <div className="min-w-0"><div className="truncate text-sm font-semibold">Lost Stars</div><div className="truncate text-xs opacity-65">Adam Levine</div><div className="mt-1 text-[10px] opacity-55">Music share</div></div>
                    </div>
                    <div className="border-t px-3 py-2 text-[11px] opacity-65">Lost Stars · Adam Levine</div>
                  </div>
                  <span className="kkt-message-time">{fmt12(m.time, lang)}</span>
                </div>
              </div>
            </div>
          );
          else {
            const content = m.type === "image"
              ? <div className={`kkt-image-bubble ${mine ? "kkt-image-mine" : ""}`}><PhotoImg src={m.image} alt="" className="kkt-img" loading="lazy" />{(m.originalText || m[lang]) && <p className="text-sm whitespace-pre-wrap">{text}</p>}</div>
              : <div className={mine ? "kkt-bubble-me" : "kkt-bubble-them"}>{text}</div>;
            parts.push(
              <div key={m.id} className={`kkt-message-row flex gap-2 ${mine ? "justify-end" : ""}`}>
                {!mine && <div className="w-10 shrink-0">{head && <KktAvatar src={open.avatar} size={40} />}</div>}
                <div className={`kkt-message-body flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  {head && <span className="text-[12px] mb-0.5 opacity-80">{m.speaker === "mom" ? tr(lang, { en: "Mom", ko: "엄마", zh: "妈妈" }) : m.speaker === "dad" ? tr(lang, { en: "Dad", ko: "아빠", zh: "爸爸" }) : m.speaker === "brother" ? tr(lang, { en: "Older brother", ko: "형", zh: "哥哥" }) : open.name}</span>}
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
      {open.id === "anton" && scene.phase === "choose-ending" && <div className="flex gap-2 px-3 py-3 border-t bg-background"><Button className="flex-1" variant="outline" onClick={() => chooseEnding("blocked")}>{tr(lang, { en: "Blocked", ko: "차단됨", zh: "被拉黑" })}</Button><Button className="flex-1" onClick={() => chooseEnding("not-blocked")}>{tr(lang, { en: "Not blocked", ko: "차단되지 않음", zh: "没有被拉黑" })}</Button></div>}
      {emoji && <div className="kkt-emoji-panel">{["😊", "ㅋㅋ", "❤️", "👍", "😭", "😂"].map((face) => <Button variant="ghost" key={face} onClick={() => { setCompose((text) => text + face); setEmoji(false); }}>{face}</Button>)}</div>}
      <form className="kkt-input" onSubmit={(event) => {
        event.preventDefault();
        submitMessage();
      }}>
        <Button type="button" variant="ghost" size="icon" aria-label={tr(lang, { en: "Send photo", ko: "사진 보내기", zh: "发送图片" })} onClick={() => upload.current?.click()}><SquarePlus /></Button>
        <input ref={upload} type="file" accept="image/*" className="hidden" onChange={async (e) => { const input = e.currentTarget; const file = input.files?.[0]; try { if (file) { const image = await fileToDataUrl(file); send(compose, image); setCompose(""); } } catch { alert(tr(lang, { en: "Could not send photo", ko: "사진을 보낼 수 없습니다", zh: "图片未发送，请重试" })); } finally { input.value = ""; } }} />
        <input aria-label={tr(lang, { en: "Message", ko: "메시지 입력", zh: "输入消息" })} placeholder={tr(lang, { en: "Message", ko: "메시지 입력", zh: "输入消息" })} disabled={open.id === "anton" && ["choose-ending", "anton-typing", "blocked"].includes(scene.phase)} className="kkt-compose" value={compose} onPointerDown={fillSuggestedReply} onFocus={fillSuggestedReply} onChange={(event) => setCompose(event.target.value)} />
        <Button type="button" variant="ghost" size="icon" aria-label={tr(lang, { en: "Emoji", ko: "이모티콘", zh: "表情" })} aria-expanded={emoji} onClick={() => setEmoji(!emoji)}><Smile size={21} /></Button>
        <Button type="button" size="icon" aria-label={tr(lang, { en: "Send message", ko: "메시지 보내기", zh: "发送消息" })} className="kkt-send" onClick={submitMessage} disabled={!compose.trim() || (open.id === "anton" && ["choose-ending", "anton-typing", "blocked"].includes(scene.phase))}><Send size={17} /></Button>
      </form>
    </div>
  );
}
