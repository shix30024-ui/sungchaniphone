import { useEffect, useRef, useState } from "react";
import { setActiveChat } from "../live";
import { type AppProps, tr } from "../i18n";
import { CONTACTS, MESSAGES, type Contact, type Msg, type MsgType } from "../story";
import { uid, usePersist } from "../store";
import { useCloudKkt } from "../kkt-cloud-store";
import { RECENTS_KEY, type RecentCall } from "../contacts";
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
import { ANTON_PROGRESS_KEY, EMPTY_PROGRESS, fixedFlow, acknowledgeFixedNode, temporaryReply, withTemporaryReplies, readTemporaryReplies, writeTemporaryReplies, type FixedProgress, type TemporaryReply } from "../fixed-conversation";
import { ANTON_OPENING, ANTON_AFTER_REASSURANCE, FIRST_PLAYER_REPLIES, FINAL_PLAYER_REPLIES, makeAntonSceneMessage, makeAntonSceneSystem, readAntonScene, updateAntonScene, startAntonWarmup, finishAntonWarmup, ANTON_WARM_OPENING, type AntonSceneState } from "../anton-scene";
import { readNewStory, updateNewStory, subscribeNewStory, OPENING_ANTON, OPENING_CHOICES, OPENING_ANTON_2, OPENING_CHOICES_2, OPENING_ANTON_3, STAGE2_ANTON, STAGE2_CHOICES, STAGE2_REASSURE, SEOYUN_STAGE3, STAGE4_ANTON, STAGE6_ANTON } from "../new-story";

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

const SEOYUN_PLAYER_OPENING = [
  { zh: "都怪那个学妹", ko: "그 후배 때문이야", en: "It's all that junior's fault." },
  { zh: "发了ig帖子是我的背影", ko: "내 뒷모습 나온 인스타 게시물을 올렸어", en: "She posted an Instagram photo showing my back." },
  { zh: "anton以为她是我女朋友", ko: "앤톤은 그 애가 내 여자친구인 줄 알았어", en: "Anton thought she was my girlfriend." },
] as const;
const SEOYUN_PLAYER_LAST_BLOCKED = { zh: "现在已经被拉黑了^", ko: "지금은 차단당했어^", en: "And now he's blocked me^" };
const SEOYUN_PLAYER_LAST_OPEN = { zh: "现在也不回我信息了", ko: "이제 내 메시지에도 답이 없어", en: "He isn't replying to my messages now either." };
const SEOYUN_PLAYER_BLOCKED_END = { zh: "不会be的", ko: "해피엔딩일 거야", en: "It won't be a bad ending." };
const SEOYUN_PLAYER_OPEN_END = { zh: "我去找他解释", ko: "내가 가서 설명할게", en: "I'll go explain it to him." };
const SEOYUN_BLOCKED_REPLIES = [
  { zh: "？？", ko: "??", en: "??" },
  { zh: "啊西八", ko: "아 씨", en: "Oh, damn." },
  { zh: "我的cp难道要be了？", ko: "내 최애 커플 설마 새드엔딩이야?", en: "Is my favorite couple really going to have a bad ending?" },
] as const;
const SEOYUN_OPEN_REPLIES = [
  { zh: "？？", ko: "??", en: "??" },
  { zh: "怎么会…", ko: "어떻게 그런 일이…", en: "How could that happen..." },
  { zh: "那现在怎么办", ko: "그럼 이제 어떡해?", en: "Then what do we do now?" },
] as const;
const SEOYUN_BLOCKED_LAST = { zh: "这次得he才行", ko: "이번엔 꼭 해피엔딩이어야 해", en: "This one has to have a happy ending." };
const SEOYUN_OPEN_LAST = { zh: "你也 吹吹耳边风吧", ko: "너도 옆에서 잘 얘기해 줘", en: "You should put in a good word too." };

function makeSeoyunTemporary(text: { zh: string; ko: string; en: string }, sender: "me" | "them", after?: Msg): TemporaryReply {
  const now = new Date();
  return { afterId: after?.id, message: {
    id: `seoyun-script-${uid()}`, contactId: "seoyun", sender, type: "text",
    ko: text.ko, zh: text.zh, en: text.en, date: after?.date ?? TODAY,
    time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    order: (after?.order ?? 0) + 1, read: true,
  } };
}

const FREE_CHAT_REPLIES = [
  { ko: "그래. 마음대로 해.", zh: "行啊，随你。", en: "Fine. Do whatever you want." },
  { ko: "굳이 나한테 설명 안 해도 돼.", zh: "不用特意跟我解释。", en: "You don't have to explain it to me." },
  { ko: "아까는 아니라며.", zh: "你刚刚不是还说不是吗？", en: "You said that wasn't the case earlier." },
  { ko: "됐어. 나 지금 연습해야 돼.", zh: "算了，我现在要练习。", en: "Whatever. I have practice now." },
  { ko: "형은 진짜 아무렇지도 않나 봐.", zh: "哥看起来是真的一点都不在意啊。", en: "You really don't seem bothered at all." },
  { ko: "나중에 얘기해.", zh: "之后再说吧。", en: "We'll talk later." },
] as const;

export default function Kakao({ lang, onHome, initialChat, onOpenInstagram }: AppProps & { initialChat?: string | null; onOpenInstagram?: () => void }) {
  const [contacts, setContacts, contactsReady] = useCloudKkt<Contact>("contact", CONTACTS);
  const [msgs, setMsgs, msgsReady] = useCloudKkt<Msg>("message", MESSAGES, completeTranslations);
  // Merge bundled story additions after both local and shared saves hydrate.
  // Shared snapshots can arrive after mount, so rerun only on that explicit refresh.
  const mergeStorySeeds = () => {
    // Do not re-import the pre-migration backup: deleted story rows can be
    // resurrected from it. Preserve current saved edits and add only missing seeds.
    setContacts((current) => {
      const byId = new Map(current.map((contact) => [contact.id, contact]));
      for (const seed of CONTACTS) {
        const existing = byId.get(seed.id);
        if (!existing) byId.set(seed.id, seed);
        else if (seed.id === "anton") byId.set(seed.id, { ...existing, name: seed.name, pinned: true });
      }
      return [...byId.values()];
    });
    // Add only the missing Oct 24 music-share conversation to existing KKT data.
    // Match message content as well as time so older saved mN IDs cannot collide.
    // Existing edits, replies, and every other date remain untouched.
    const oct24Seeds = MESSAGES.filter((message) => message.contactId === "anton" && message.date === "2026-10-24");
    setMsgs((current) => {
      const signature = (message: Msg) => [message.contactId, message.date, message.time, message.sender, message.type, message.ko, message.zh].join("|");
      const existing = new Set(current.map(signature));
      const missing = oct24Seeds.filter((message) => !existing.has(signature(message)));
      return missing.length ? [...current, ...missing] : current;
    });
  };
  useEffect(() => {
    if (!contactsReady || !msgsReady) return;
    mergeStorySeeds();
    window.addEventListener("phone-shared-refresh", mergeStorySeeds);
    return () => window.removeEventListener("phone-shared-refresh", mergeStorySeeds);
  // The migration intentionally uses the latest persisted value through usePersist setters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactsReady, msgsReady]);
  const [openId, setOpenId] = useState<string | null>(initialChat ?? null);
  // Temporary replies live in page memory (fixed-conversation module), so they
  // survive leaving/re-entering the chat but vanish on refresh or close.
  const [temporary, setTemporaryState] = useState<TemporaryReply[]>(() => readTemporaryReplies("anton"));
  const [seoyunTemporary, setSeoyunTemporaryState] = useState<TemporaryReply[]>(() => readTemporaryReplies("seoyun"));
  const setSeoyunTemporary = (updater: (old: TemporaryReply[]) => TemporaryReply[]) => {
    const next = updater(readTemporaryReplies("seoyun"));
    writeTemporaryReplies("seoyun", next);
    setSeoyunTemporaryState(next);
    window.dispatchEvent(new CustomEvent("phone-store", { detail: "kkt-temporary-seoyun" }));
  };
  const setTemporary = (updater: (old: TemporaryReply[]) => TemporaryReply[]) =>
    setTemporaryState((old) => {
      const next = updater(old);
      writeTemporaryReplies("anton", next);
      window.dispatchEvent(new CustomEvent("phone-store", { detail: "kkt-temporary" }));
      return next;
    });
  const [scene, setScene] = useState<AntonSceneState>(() => readAntonScene());
  const [newStory, setNewStory] = useState(() => readNewStory());
  useEffect(() => subscribeNewStory(() => setNewStory(readNewStory())), []);
  const patchScene = (patch: Partial<AntonSceneState>) => setScene(updateAntonScene(patch));
  const [progress] = usePersist<FixedProgress>(ANTON_PROGRESS_KEY, EMPTY_PROGRESS);
  // One-time: move large chat images out of the small browser storage. Text and order are untouched.
  useEffect(() => { void moveKktImagesToDb(); }, []);
  useEffect(() => { setActiveChat(openId); return () => setActiveChat(null); }, [openId]);
  // Stage 1 begins only when the player opens Anton's existing KKT chat.
  useEffect(() => {
    if (openId !== "anton" || newStory.stage !== 0) return;
    let anchor = withTemporaryReplies(sortMsgs(msgs.filter((m) => m.contactId === "anton")), readTemporaryReplies("anton")).at(-1);
    let index = 0;
    let cancelled = false;
    let timer: number | undefined;
    const deliverNext = () => {
      if (cancelled) return;
      setAntonTyping(true);
      timer = window.setTimeout(() => {
        if (cancelled) return;
        const line = OPENING_ANTON[index];
        if (!line) { setAntonTyping(false); return; }
        const incoming = temporaryReply(line.zh, lang, anchor);
        incoming.message.sender = "them";
        incoming.message.ko = line.ko; incoming.message.zh = line.zh; incoming.message.en = line.en;
        setTemporary((old) => [...old, incoming]);
        anchor = incoming.message;
        index += 1;
        if (index < OPENING_ANTON.length) deliverNext();
        else {
          setAntonTyping(false);
          updateNewStory({ stage: 1 });
        }
      }, 950);
    };
    deliverNext();
    return () => { cancelled = true; if (timer !== undefined) window.clearTimeout(timer); setAntonTyping(false); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, newStory.stage]);
  // Stage 2 is unlocked by viewing Yuna's X post, then appears when KKT is reopened.
  useEffect(() => {
    if (openId !== "anton" || newStory.stage !== 3) return;
    let anchor = withTemporaryReplies(sortMsgs(msgs.filter((m) => m.contactId === "anton")), readTemporaryReplies("anton")).at(-1);
    for (const line of STAGE2_ANTON.slice(0, 3)) {
      const incoming = temporaryReply(line.zh, lang, anchor);
      incoming.message.sender = "them";
      incoming.message.ko = line.ko; incoming.message.zh = line.zh; incoming.message.en = line.en;
      setTemporary((old) => [...old, incoming]); anchor = incoming.message;
    }
    updateNewStory({ stage: 4, stage2Replies: 0, stage2Reassurance: 0 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, newStory.stage]);
  // Stage 3's Seoyun messages stay in the separate temporary Seoyun thread.
  useEffect(() => {
    if (openId !== "seoyun" || newStory.stage !== 6 || newStory.seoyunReplies > 0) return;
    let anchor = withTemporaryReplies(sortMsgs(msgs.filter((m) => m.contactId === "seoyun")), readTemporaryReplies("seoyun")).at(-1);
    const thread: Array<{ sender: "me" | "them"; line: { zh: string; ko: string; en: string } }> = [
      { sender: "them", line: SEOYUN_STAGE3[0]! },
      { sender: "them", line: SEOYUN_STAGE3[1]! },
      { sender: "them", line: SEOYUN_STAGE3[2]! },
      { sender: "me", line: { ko: "후배가 내 뒷모습 나온 인스타 게시물을 올렸어", zh: "有学妹发了ig是我的背影", en: "A junior posted an Instagram photo of my back." } },
      { sender: "me", line: { ko: "앤톤은 그걸 여자친구라고 생각했어", zh: "他以为是女朋友", en: "Anton thought she was my girlfriend." } },
      { sender: "them", line: SEOYUN_STAGE3[3]! },
      { sender: "them", line: SEOYUN_STAGE3[4]! },
      { sender: "them", line: SEOYUN_STAGE3[5]! },
      { sender: "me", line: { ko: "...", zh: "…", en: "..." } },
      { sender: "me", line: { ko: "이제 나한테 답도 안 해 ㅎㅎ", zh: "他现在都不理我了ㅎㅎ", en: "He isn't replying to me now eitherㅎㅎ" } },
      { sender: "them", line: SEOYUN_STAGE3[6]! },
      { sender: "them", line: SEOYUN_STAGE3[7]! },
      { sender: "them", line: SEOYUN_STAGE3[8]! },
      { sender: "them", line: SEOYUN_STAGE3[9]! },
    ];
    for (const item of thread) {
      const incoming = makeSeoyunTemporary(item.line, item.sender, anchor);
      setSeoyunTemporary((old) => [...old, incoming]); anchor = incoming.message;
    }
    updateNewStory({ seoyunReplies: thread.length, stage: 7 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, newStory.stage]);
  // Viewing Anton's Instagram story unlocks the next KKT conversation.
  useEffect(() => {
    if (openId !== "anton" || newStory.stage !== 8) return;
    let anchor = withTemporaryReplies(sortMsgs(msgs.filter((m) => m.contactId === "anton")), readTemporaryReplies("anton")).at(-1);
    const speakers: Array<"me" | "them"> = ["me","them","me","me","me","them","me","me","me","me","them","them","them","them","them","me","me","me","me","me","them","them"];
    for (let i = 0; i < STAGE4_ANTON.length; i++) {
      const line = STAGE4_ANTON[i]!;
      const incoming = temporaryReply(line.zh, lang, anchor);
      incoming.message.sender = speakers[i] ?? "them";
      incoming.message.ko = line.ko; incoming.message.zh = line.zh; incoming.message.en = line.en;
      setTemporary((old) => [...old, incoming]); anchor = incoming.message;
    }
    updateNewStory({ stage: 9 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, newStory.stage]);
  // The Yuna DM resolution unlocks the final KKT conversation.
  useEffect(() => {
    if (openId !== "anton" || newStory.stage !== 10) return;
    let anchor = withTemporaryReplies(sortMsgs(msgs.filter((m) => m.contactId === "anton")), readTemporaryReplies("anton")).at(-1);
    const speakers: Array<"me" | "them"> = ["them","them","me","me","them","me","me","me","them","them","them"];
    for (let i = 0; i < STAGE6_ANTON.length; i++) {
      const line = STAGE6_ANTON[i]!;
      const incoming = temporaryReply(line.zh, lang, anchor);
      incoming.message.sender = speakers[i] ?? "them";
      incoming.message.ko = line.ko; incoming.message.zh = line.zh; incoming.message.en = line.en;
      setTemporary((old) => [...old, incoming]); anchor = incoming.message;
    }
    updateNewStory({ stage: 11 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, newStory.stage]);
  // The KKT-first route begins with a gentle two-message exchange, not the argument.
  useEffect(() => {
    if (openId !== "anton" || scene.phase !== "idle" || scene.openingRoute !== "kkt") return;
    startAntonWarmup();
    setScene(readAntonScene());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, scene.phase]);
  useEffect(() => {
    if (openId !== "anton" || scene.phase !== "warm-opening") return;
    const line = ANTON_WARM_OPENING[scene.antonReplyCount];
    if (!line) { finishAntonWarmup(); setScene(readAntonScene()); setAntonTyping(false); return; }
    setAntonTyping(true);
    const timer = window.setTimeout(() => {
      const latest = readTemporaryReplies("anton");
      const anchor = latest.at(-1)?.message ?? sortMsgs(msgs.filter((m) => m.contactId === "anton")).at(-1);
      const incoming = makeAntonSceneMessage(line, anchor);
      setTemporary((old) => [...old, incoming]);
      const nextCount = scene.antonReplyCount + 1;
      if (nextCount >= ANTON_WARM_OPENING.length) {
        finishAntonWarmup();
        setAntonTyping(false);
      } else {
        updateAntonScene({ antonReplyCount: nextCount });
      }
      setScene(readAntonScene());
    }, 1150);
    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, scene.phase, scene.antonReplyCount]);

  // After the KKT push, finish Anton's jealous burst one message at a time when the chat is opened.
  useEffect(() => {
    if (openId !== "anton" || scene.phase !== "anger-opening") return;
    const line = ANTON_OPENING[scene.antonReplyCount];
    if (!line) {
      patchScene({ phase: "first-replies", antonReplyCount: 0 });
      return;
    }
    setAntonTyping(true);
    const timer = window.setTimeout(() => {
      const latest = readTemporaryReplies("anton");
      const anchor = latest.at(-1)?.message ?? sortMsgs(msgs.filter((m) => m.contactId === "anton")).at(-1);
      const incoming = makeAntonSceneMessage(line, anchor);
      setTemporary((old) => [...old, incoming]);
      const nextCount = scene.antonReplyCount + 1;
      if (nextCount >= ANTON_OPENING.length) {
        patchScene({ phase: "first-replies", firstReplyCount: 0, antonReplyCount: 0 });
        setAntonTyping(false);
      } else {
        patchScene({ antonReplyCount: nextCount });
      }
      setScene(readAntonScene());
    }, 1100);
    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, scene.phase, scene.antonReplyCount]);

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
  const [blockedActionOpen, setBlockedActionOpen] = useState(false);
  const [, setRecents] = usePersist<RecentCall[]>(RECENTS_KEY, []);
  const callStarted = useRef("");
  const startCall = (direction: "outgoing" | "incoming") => { callStarted.current = new Date().toISOString(); setCall(direction); };
  const [menu, setMenu] = useState(false);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [emoji, setEmoji] = useState(false);
  // Leaving the chat keeps temporary replies in page memory; only a page
  // refresh or close clears them. Compose/typing UI state still resets.
  useEffect(() => {
    setCompose("");
    setEmoji(false);
    if (openId !== "anton" || editing || call) setAntonTyping(false);
  }, [openId, editing, call]);
  const [listTab, setListTab] = useState<"friends" | "chats" | "openchat" | "shopping" | "more">("chats");
  const [listMenu, setListMenu] = useState(false);
  const [gifts, setGifts] = usePersist<{ id: string; title: string }[]>("phone-kkt-gifts-v1", []);
  const [giftDraft, setGiftDraft] = useState<{ id: string; title: string } | null>(null);
  const [listSearch, setListSearch] = useState("");
  const [listSearching, setListSearching] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  const composeInput = useRef<HTMLInputElement>(null);
  const [queue] = usePersist<PendingReply[]>(QUEUE_KEY, []);
  const scroll = useRef<HTMLDivElement>(null);
  const editIds = useRef(new Set<string>());
  const [antonTyping, setAntonTyping] = useState(false);
  const [seoyunTyping, setSeoyunTyping] = useState(false);
  const typing = (openId === "anton" && antonTyping) || (openId === "seoyun" && seoyunTyping) || (openId !== "anton" && openId !== "seoyun" && queue.some((q) => !q.failed && q.channel === "kkt" && q.contactId === openId));
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

  // Render bundled contacts even when an older shared snapshot only contains Anton.
  // Saved/edited rows keep priority by stable ID; missing story seeds remain visible.
  const displayContacts = [...new Map([...CONTACTS, ...contacts].map((contact) => [contact.id, contact])).values()];
  // The hydrated store is the source of truth. MESSAGES is only the initial
  // fallback for a genuinely empty store; merging it here would resurrect rows
  // that the owner deliberately deleted from a saved conversation.
  const mergedMsgs = msgs;
  const seenMessageContent = new Set<string>();
  const displayMsgs = mergedMsgs.filter((message) => {
    // These Anton story dates were explicitly removed; exclude stale local/shared
    // copies too, so a previous save cannot bring them back into the thread.
    if (message.contactId === "anton" && message.date === "2026-10-26") return false;
    const contentKey = [message.contactId, message.date, message.time, message.sender, message.type, message.ko, message.zh, message.en ?? "", message.image ?? ""].join("\u001f");
    if (seenMessageContent.has(contentKey)) return false;
    seenMessageContent.add(contentKey);
    return true;
  });
  const temporaryAntonMessages = temporary.map((reply) => reply.message);
  const unreadForContact = (contactId: string) => Math.max(
    contacts.find((contact) => contact.id === contactId)?.unread || 0,
    displayMsgs.filter((message) => message.contactId === contactId && message.live && !message.read).length,
    contactId === "anton" ? temporaryAntonMessages.filter((message) => message.sender === "them" && !message.read).length : 0,
  );
  const open = displayContacts.find((c) => c.id === openId);

  if (!open) {
    const rows = displayContacts
      .map((c) => {
        const saved = displayMsgs.filter((m) => m.contactId === c.id && m.type !== "date");
        const combined = c.id === "anton" ? [...saved, ...temporaryAntonMessages.filter((m) => m.type !== "date")] : c.id === "seoyun" ? [...saved, ...readTemporaryReplies("seoyun").map((r) => r.message).filter((m) => m.type !== "date")] : saved;
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

  const savedThread = sortMsgs(displayMsgs.filter((m) => m.contactId === open.id));
  const flow = fixedFlow(savedThread, progress);
  const fixedThread = flow.visible;
  const thread = open.id === "anton" ? withTemporaryReplies(fixedThread, temporary) : open.id === "seoyun" ? withTemporaryReplies(fixedThread, seoyunTemporary) : fixedThread;
  const deliverSeoyunReplies = (lines: readonly { zh: string; ko: string; en: string }[], anchor: Msg | undefined) => {
    lines.forEach((line, index) => {
      window.setTimeout(() => {
        setSeoyunTyping(true);
        window.setTimeout(() => {
          const latest = readTemporaryReplies("seoyun");
          const previous = latest.at(-1)?.message ?? anchor;
          const incoming = makeSeoyunTemporary(line, "them", previous);
          setSeoyunTemporary((old) => [...old, incoming]);
          setSeoyunTyping(false);
        }, 850);
      }, index * 1500);
    });
  };

  const send = (text: string, image?: string) => {
    if (open.id === "seoyun" && !image) {
      const introDone = msgs.filter((m) => m.contactId === "seoyun" && m.live && m.notified && m.id.startsWith("seoyun-after-anton-")).length >= 3;
      if (!introDone) { sendChat("kkt", open.id, text, lang, Date.now(), image); return; }
      const currentThread = withTemporaryReplies(fixedThread, seoyunTemporary);
      const playerMsg = makeSeoyunTemporary({ zh: text, ko: text, en: text }, "me", currentThread.at(-1));
      setSeoyunTemporary((old) => [...old, playerMsg]);
      const playerCount = seoyunTemporary.filter((r) => r.message.sender === "me").length + 1;
      const replyCount = seoyunTemporary.filter((r) => r.message.sender === "them").length;
      const blocked = readAntonScene().ending === "blocked";
      if (playerCount === 4 && replyCount === 0) {
        // "Blocked" refers to Anton blocking Sungchan, not Seoyun.
        deliverSeoyunReplies(blocked ? SEOYUN_BLOCKED_REPLIES : SEOYUN_OPEN_REPLIES, playerMsg.message);
      }
      return;
    }
    if (open.id !== "anton") { sendChat("kkt", open.id, text, lang, Date.now(), image); return; }
    const visibleThread = withTemporaryReplies(fixedThread, readTemporaryReplies("anton"));
    const playerMsg = temporaryReply(text, lang, visibleThread.at(-1), image);
    if (open.id === "anton" && newStory.stage === 4 && newStory.stage2Replies >= STAGE2_CHOICES.length) playerMsg.message.read = false;
    setTemporary((old) => [...old, playerMsg]);
    if (open.id === "anton" && (newStory.stage === 1 || newStory.stage === 4) && !image) {
      const currentStory = readNewStory();
      const appendAnton = (line: { zh: string; ko: string; en: string }) => {
        setAntonTyping(true);
        window.setTimeout(() => {
          if (openId !== "anton") { setAntonTyping(false); return; }
          const anchor = withTemporaryReplies(sortMsgs(msgs.filter((m) => m.contactId === "anton")), readTemporaryReplies("anton")).at(-1);
          const incoming = temporaryReply(line.zh, lang, anchor);
          incoming.message.sender = "them";
          incoming.message.ko = line.ko; incoming.message.zh = line.zh; incoming.message.en = line.en;
          setTemporary((old) => [...old, incoming]);
          setAntonTyping(false);
        }, 950);
      };
      if (currentStory.stage === 1 && currentStory.openingReplies < OPENING_CHOICES.length) {
        const count = currentStory.openingReplies + 1;
        updateNewStory({ openingReplies: count });
        if (count === OPENING_CHOICES.length) appendAnton(OPENING_ANTON_2);
      } else if (currentStory.stage === 1 && currentStory.reassuranceReplies < OPENING_CHOICES_2.length) {
        const count = currentStory.reassuranceReplies + 1;
        updateNewStory({ reassuranceReplies: count });
        if (count === OPENING_CHOICES_2.length) { appendAnton(OPENING_ANTON_3); updateNewStory({ stage: 2 }); }
      } else if (currentStory.stage === 4 && currentStory.stage2Replies < STAGE2_CHOICES.length) {
        const count = currentStory.stage2Replies + 1;
        updateNewStory({ stage2Replies: count });
        if (count === STAGE2_CHOICES.length) {
          let anchor = withTemporaryReplies(sortMsgs(msgs.filter((m) => m.contactId === "anton")), readTemporaryReplies("anton")).at(-1);
          for (const line of STAGE2_ANTON.slice(3)) {
            const incoming = temporaryReply(line.zh, lang, anchor);
            incoming.message.sender = "them"; incoming.message.ko = line.ko; incoming.message.zh = line.zh; incoming.message.en = line.en;
            setTemporary((old) => [...old, incoming]); anchor = incoming.message;
          }
        }
      } else if (currentStory.stage === 4 && currentStory.stage2Reassurance < STAGE2_REASSURE.length) {
        const count = currentStory.stage2Reassurance + 1;
        updateNewStory({ stage2Reassurance: count, ...(count === STAGE2_REASSURE.length ? { stage: 5 } : {}) });
        if (count === STAGE2_REASSURE.length) window.setTimeout(() => startCall("outgoing"), 250);
      }
    }
    if (flow.waiting) acknowledgeFixedNode(flow.waiting.id);
    const current = readAntonScene();
    if (current.phase === "awaiting-instagram" || current.phase === "warm-opening") {
      // Free chat is player-led here: Anton no longer sends an automatic reply.
    } else if (current.phase === "first-replies") {
      const count = current.firstReplyCount + 1;
      patchScene({ firstReplyCount: count, phase: count >= FIRST_PLAYER_REPLIES.length ? "choose-ending" : "first-replies" });
    } else if (current.phase === "final-replies") {
      const count = current.finalReplyCount + 1;
      patchScene({ finalReplyCount: count, phase: count >= FINAL_PLAYER_REPLIES.length ? "done" : "final-replies" });
    } else if (current.phase === "done" && current.ending === "not-blocked") {
      patchScene({ freeMessageCount: current.freeMessageCount + 1 });
      // No timed or automatic Anton replies in free chat.
    }
  };

  const chooseEnding = (ending: "blocked" | "not-blocked") => {
    const visibleThread = withTemporaryReplies(fixedThread, readTemporaryReplies("anton"));
    const anchor = visibleThread.at(-1);
    if (ending === "blocked") {
      const blockedSystem = makeAntonSceneSystem(
        tr(lang, { en: "You have been blocked.", ko: "차단되었습니다.", zh: "已被拉黑" }),
        lang,
        anchor,
      );
      setTemporary((old) => [...old, blockedSystem]);
      patchScene({ ending, phase: "blocked" });
      setBlockedActionOpen(false);
      window.setTimeout(() => setBlockedActionOpen(true), 720);
      // The blocked branch still has one final short incoming message from Anton.
      window.setTimeout(() => {
        const latest = readTemporaryReplies("anton");
        const last = latest.at(-1)?.message ?? blockedSystem.message;
        const question = makeAntonSceneMessage(
          { zh: "？", ko: "?", en: "?" },
          last,
        );
        setTemporary((old) => [...old, question]);
      }, 650);
    } else {
      patchScene({ ending, phase: "anton-typing", antonReplyCount: 0 });
    }
  };
  if (call) return <Call contact={open} lang={lang} incoming={call === "incoming"} simulateFailure={(scene.ending === "blocked" || newStory.stage === 5) && call === "outgoing"} onClose={() => setCall(null)} onComplete={(result) => setRecents((current) => [{ id: uid(), contactId: open.id, name: open.name, time: callStarted.current || new Date().toISOString(), simulated: true, ...result }, ...current])} />;
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
    if (open.id === "anton" && newStory.stage === 1) {
      if (newStory.openingReplies < OPENING_CHOICES.length) return OPENING_CHOICES[newStory.openingReplies]?.[lang];
      if (newStory.reassuranceReplies < OPENING_CHOICES_2.length) return OPENING_CHOICES_2[newStory.reassuranceReplies]?.[lang];
    }
    if (open.id === "anton" && newStory.stage === 4) {
      if (newStory.stage2Replies < STAGE2_CHOICES.length) return STAGE2_CHOICES[newStory.stage2Replies]?.[lang];
      if (newStory.stage2Reassurance < STAGE2_REASSURE.length) return STAGE2_REASSURE[newStory.stage2Reassurance]?.[lang];
    }
    const current = readAntonScene();
    if (open.id === "seoyun") {
      const introDone = msgs.filter((m) => m.contactId === "seoyun" && m.live && m.notified && m.id.startsWith("seoyun-after-anton-")).length >= 3;
      if (!introDone) return undefined;
      const replies = readTemporaryReplies("seoyun");
      const playerCount = replies.filter((r) => r.message.sender === "me").length;
      const replyCount = replies.filter((r) => r.message.sender === "them").length;
      if (playerCount < 3) return SEOYUN_PLAYER_OPENING[playerCount]?.[lang];
      if (playerCount === 3) return (current.ending === "blocked" ? SEOYUN_PLAYER_LAST_BLOCKED : SEOYUN_PLAYER_LAST_OPEN)[lang];
      if (playerCount === 4 && replyCount >= 3) return (current.ending === "blocked" ? SEOYUN_PLAYER_BLOCKED_END : SEOYUN_PLAYER_OPEN_END)[lang];
      if (playerCount === 5 && replyCount >= 3 && current.ending === "blocked") return SEOYUN_BLOCKED_LAST[lang];
      if (playerCount === 5 && replyCount >= 3 && current.ending !== "blocked") return SEOYUN_OPEN_LAST[lang];
      return undefined;
    }
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
      {menu && <div className="kkt-menu-sheet">{owner && <Button variant="ghost" onClick={() => { setMenu(false); startEdit(); }}>{L.edit}</Button>}<Button variant="ghost" onClick={() => { setMenu(false); startCall("outgoing"); }}><Phone />{tr(lang, { en: "Call", ko: "전화", zh: "拨打电话" })}</Button><Button variant="ghost" onClick={() => { setMenu(false); startCall("incoming"); }}><PhoneIncoming />{tr(lang, { en: "Simulate incoming call", ko: "모의 전화 수신", zh: "模拟来电" })}</Button></div>}
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
      {open.id === "anton" && blockedActionOpen && scene.ending === "blocked" && !call && <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/35 p-6" role="dialog" aria-modal="true">
        <div className="w-full max-w-xs rounded-2xl bg-card text-card-foreground border shadow-xl p-5 space-y-3">
          <div className="text-center"><b className="block text-base">KakaoTalk 알림</b><p className="text-sm text-muted-foreground mt-2">{tr(lang, { en: "Message could not be sent.", ko: "메시지를 보낼 수 없습니다.", zh: "无法发送消息。" })}</p></div>
          <Button className="w-full" onClick={() => { setBlockedActionOpen(false); startCall("outgoing"); }}><Phone className="mr-2" />{tr(lang, { en: "Call Anton", ko: "전화 걸기", zh: "拨打电话" })}</Button>
          <Button variant="outline" className="w-full" onClick={() => { setBlockedActionOpen(false); onOpenInstagram?.(); }}><MessageCircle className="mr-2" />{tr(lang, { en: "Message Anton on Instagram", ko: "인스타그램으로 메시지 보내기", zh: "去 Instagram 私信 Anton" })}</Button>
          <Button variant="outline" className="w-full" onClick={() => { setBlockedActionOpen(false); setOpenId("seoyun"); }}><MessageCircle className="mr-2" />{tr(lang, { en: "Open Seoyun chat", ko: "서윤 채팅 열기", zh: "打开 Seoyun 聊天" })}</Button>
          <Button variant="ghost" className="w-full" onClick={() => setBlockedActionOpen(false)}>{tr(lang, { en: "Later", ko: "나중에", zh: "稍后" })}</Button>
        </div>
      </div>}
      {open.id === "anton" && scene.phase === "choose-ending" && <div className="flex gap-2 px-3 py-3 border-t bg-background"><Button className="flex-1" variant="outline" onClick={() => chooseEnding("blocked")}>{tr(lang, { en: "Blocked", ko: "차단됨", zh: "被拉黑" })}</Button><Button className="flex-1" onClick={() => chooseEnding("not-blocked")}>{tr(lang, { en: "Not blocked", ko: "차단되지 않음", zh: "没有被拉黑" })}</Button></div>}

      {emoji && <div className="kkt-emoji-panel">{["😊", "ㅋㅋ", "❤️", "👍", "😭", "😂"].map((face) => <Button variant="ghost" key={face} onClick={() => { setCompose((text) => text + face); setEmoji(false); }}>{face}</Button>)}</div>}
      {open.id === "anton" && suggestedReply() && <div className="px-3 pt-2 bg-background border-t"><Button type="button" variant="outline" className="w-full justify-start text-left whitespace-normal h-auto min-h-10" onClick={() => setCompose(suggestedReply() ?? "")}>{suggestedReply()}</Button></div>}
      <form className="kkt-input" onSubmit={(event) => {
        event.preventDefault();
        submitMessage();
      }}>
        <Button type="button" variant="ghost" size="icon" aria-label={tr(lang, { en: "Send photo", ko: "사진 보내기", zh: "发送图片" })} onClick={() => upload.current?.click()}><SquarePlus /></Button>
        <input ref={upload} type="file" accept="image/*" className="hidden" onChange={async (e) => { const input = e.currentTarget; const file = input.files?.[0]; try { if (file) { const image = await fileToDataUrl(file); send(compose, image); setCompose(""); } } catch { alert(tr(lang, { en: "Could not send photo", ko: "사진을 보낼 수 없습니다", zh: "图片未发送，请重试" })); } finally { input.value = ""; } }} />
        <input ref={composeInput} aria-label={tr(lang, { en: "Message", ko: "메시지 입력", zh: "输入消息" })} placeholder={tr(lang, { en: "Message", ko: "메시지 입력", zh: "输入消息" })} disabled={open.id === "anton" && ["warm-opening", "anger-opening", "choose-ending", "anton-typing", "blocked"].includes(scene.phase)} className="kkt-compose" value={compose} onPointerDown={fillSuggestedReply} onFocus={fillSuggestedReply} onChange={(event) => setCompose(event.target.value)} />
        <Button type="button" variant="ghost" size="icon" aria-label={tr(lang, { en: "Emoji", ko: "이모티콘", zh: "表情" })} aria-expanded={emoji} onClick={() => setEmoji(!emoji)}><Smile size={21} /></Button>
        <Button type="button" size="icon" aria-label={tr(lang, { en: "Send message", ko: "메시지 보내기", zh: "发送消息" })} className="kkt-send" onClick={submitMessage} disabled={!compose.trim() || (open.id === "anton" && ["warm-opening", "anger-opening", "choose-ending", "anton-typing", "blocked"].includes(scene.phase))}><Send size={17} /></Button>
      </form>
    </div>
  );
}
