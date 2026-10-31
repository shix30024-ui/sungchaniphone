/**
 * Simulated live KakaoTalk messages from Anton.
 * Messages are appended to the existing saved chat (never replacing it), each with a fixed id,
 * so a message can only ever be delivered once — across reloads, app switches and tabs.
 */
import { CONTACTS, MESSAGES, type Contact, type Msg } from "./story";
import { STORY_DATE } from "./chronology";
import { backupPhoneData, readStored } from "./store";
import { fixedFlow, readFixedProgress } from "./fixed-conversation";
import { readAntonScene } from "./anton-scene";

export const MSGS_KEY = "kkt-msgs-v1";
export const CONTACTS_KEY = "kkt-contacts-v1";
export const LIVE_SETTINGS_KEY = "kkt-live-settings-v1";
export const LIVE_STATE_KEY = "kkt-live-state-v1";
export const LIVE_CONTACT = "anton";
export const SEOYUN_CONTACT = "seoyun";
export const STORE_EVENT = "phone-store";
export const LIVE_EVENT = "kkt-live-message";

export type Frequency = "low" | "normal" | "high";
export type LiveSettings = { enabled: boolean; frequency: Frequency; preview: boolean };
export type LiveState = { delivered: string[]; nextAt: number };
export const DEFAULT_LIVE_SETTINGS: LiveSettings = { enabled: true, frequency: "normal", preview: true };

/** Real-time wait range (ms) between automatic messages. */
export const FREQUENCY_RANGE: Record<Frequency, [number, number]> = {
  low: [6 * 60_000, 10 * 60_000],
  normal: [2 * 60_000, 4 * 60_000],
  high: [40_000, 80_000],
};

type LiveLine = { id: string; ko: string; zh: string; en: string; image?: string };

/**
 * Story nodes for the evening of 2026-10-26 (after the 14:30 lunch), in order.
 * Comfortable 2026 tone: Anton lives farther away now, has his own practice and friends.
 */
export const LIVE_LINES: LiveLine[] = [
  { id: "live-2026-01", ko: "형 집 도착했어?", zh: "哥到家了吗？", en: "Hyung, you home yet?" },
  { id: "live-2026-02", ko: "나 이제 연습실 나왔어 오늘 활 너무 안 맞았음ㅋㅋ", zh: "我刚从练习室出来，今天弓怎么拉都不顺哈哈", en: "Just left the practice room lol my bowing was a mess today" },
  { id: "live-2026-03", ko: "", zh: "", en: "", image: "img:practice" },
  { id: "live-2026-04", ko: "저녁 먹었어? 나 아직 안 먹음", zh: "吃晚饭了吗？我还没吃", en: "Did you eat? I haven't yet" },
  { id: "live-2026-05", ko: "편의점 갈까 집 가서 라면 끓일까 고민 중", zh: "在纠结是去便利店还是回家煮泡面", en: "Debating convenience store vs going home and making ramyeon" },
  { id: "live-2026-06", ko: "아 그리고 형이 말한 노래 들어봤는데 생각보다 좋더라", zh: "对了，哥说的那首歌我听了，比想象中好听", en: "Oh and I listened to that song you mentioned, it's better than I expected" },
  { id: "live-2026-07", ko: "베이스 라인 따라 쳐보고 싶어짐", zh: "有点想跟着弹一下贝斯线", en: "Kinda want to try playing along to the bass line" },
  { id: "live-2026-08", ko: "형 이번 주 목요일에 시간 돼?", zh: "哥这周四有空吗？", en: "Hyung, are you free this Thursday?" },
  { id: "live-2026-09", ko: "학교 앞에 새로 생긴 국밥집 과 동기들이 맛있대", zh: "系里同学说学校门口新开的汤饭店很好吃", en: "My classmates say the new gukbap place by school is good" },
  { id: "live-2026-10", ko: "", zh: "", en: "", image: "img:cafe" },
  { id: "live-2026-11", ko: "아까 지나가다 찍음 형 좋아할 것 같아서", zh: "刚才路过拍的，觉得哥会喜欢", en: "Took this walking past, thought you'd like it" },
  { id: "live-2026-12", ko: "지하철 막차 놓칠 뻔ㅋㅋ 집 멀어서 진짜 귀찮아", zh: "差点没赶上末班地铁哈哈，家太远了真麻烦", en: "Almost missed the last train lol living this far is such a pain" },
  { id: "live-2026-13", ko: "형 내일 1교시지? 너무 늦게 자지 마", zh: "哥明天第一节有课吧？别睡太晚", en: "You have first period tomorrow right? Don't stay up too late" },
  { id: "live-2026-14", ko: "나 씻고 올게", zh: "我去洗个澡", en: "Gonna go shower" },
];

const read = <T,>(key: string, fallback: T): T => {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch { return fallback; }
};

export const notifyStore = (key: string) => {
  window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: key }));
};

export const loadLiveSettings = (): LiveSettings => ({ ...DEFAULT_LIVE_SETTINGS, ...read<Partial<LiveSettings>>(LIVE_SETTINGS_KEY, {}) });
export const saveLiveSettings = (s: LiveSettings) => {
  localStorage.setItem(LIVE_SETTINGS_KEY, JSON.stringify(s));
  notifyStore(LIVE_SETTINGS_KEY);
};
export const loadLiveState = (): LiveState => ({ delivered: [], nextAt: 0, ...read<Partial<LiveState>>(LIVE_STATE_KEY, {}) });
const saveLiveState = (s: LiveState) => localStorage.setItem(LIVE_STATE_KEY, JSON.stringify(s));

export const nextDelay = (f: Frequency, rand = Math.random) => {
  const [lo, hi] = FREQUENCY_RANGE[f];
  return Math.round(lo + (hi - lo) * rand());
};

/** Which chat is currently on screen (set by the KakaoTalk app). */
let activeChat: string | null = null;
export const setActiveChat = (id: string | null) => { activeChat = id; };
export const getActiveChat = () => activeChat;

const addMinutes = (time: string, n: number) => {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const total = Math.min(23 * 60 + 59, h * 60 + m + n);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/** Pick the next undelivered story line, skipping ids already in the chat. */
export function nextLine(msgs: Msg[], delivered: string[]): LiveLine | undefined {
  const have = new Set([...msgs.map((m) => m.id), ...delivered]);
  return LIVE_LINES.find((l) => !have.has(l.id));
}

/**
 * Append one message from Anton to the saved chat. Returns the new message, or null when
 * there is nothing new to send. Never rewrites existing messages.
 */
export function deliverLiveMessage(opts: { test?: boolean } = {}): Msg | null {
  if (readAntonScene().started) return null;
  backupPhoneData();
  const msgs = readStored<Msg[]>(MSGS_KEY, MESSAGES);
  const contacts = readStored<Contact[]>(CONTACTS_KEY, CONTACTS);
  if (fixedFlow(msgs, readFixedProgress()).waiting) return null;
  const state = loadLiveState();
  let line = nextLine(msgs, state.delivered);
  if (!line || msgs.some((m) => m.id === line.id)) return null;

  const today = msgs.filter((m) => m.date === STORY_DATE).map((m) => m.time).sort().at(-1) ?? "20:26";
  const time = addMinutes(today < "20:26" ? "20:26" : today, 1);
  const viewing = activeChat === LIVE_CONTACT;
  const msg: Msg = {
    id: line.id, contactId: LIVE_CONTACT, sender: "them", type: line.image ? "image" : "text",
    ko: line.ko, zh: line.zh, en: line.en, image: line.image ?? "", date: STORY_DATE, time,
    order: 200000 + state.delivered.length, live: true, read: viewing, notified: true,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(MSGS_KEY, JSON.stringify([...msgs, msg]));
  if (!viewing) {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts.map((c) => (c.id === LIVE_CONTACT ? { ...c, unread: (c.unread || 0) + 1 } : c))));
  }
  saveLiveState({ ...state, delivered: [...state.delivered, line.id] });
  notifyStore(MSGS_KEY);
  notifyStore(CONTACTS_KEY);
  if (!viewing) window.dispatchEvent(new CustomEvent(LIVE_EVENT, { detail: msg }));
  return msg;
}

/** Called on a timer: sends at most one message when due, then schedules the next. */
export function tickLive(now = Date.now()): Msg | null {
  // Once the player-driven Anton scene begins, pause unsolicited live story drops.
  if (readAntonScene().started) return null;
  const settings = loadLiveSettings();
  if (!settings.enabled) return null;
  // Let the current conversation finish instead of interrupting with an unrelated story node.
  const pending = readStored<{ channel: string; contactId: string; dueAt: number }[]>("phone-reply-queue-v1", []).filter((q) => !(q.channel === "kkt" && q.contactId === "anton"));
  const recent = read<Msg[]>(MSGS_KEY, []).filter((m) => m.contactId !== "anton" && m.originalText).at(-1);
  if (pending.length || (recent?.createdAt && now - new Date(recent.createdAt).getTime() < 120000)) return null;
  const state = loadLiveState();
  if (!state.nextAt) { saveLiveState({ ...state, nextAt: now + nextDelay(settings.frequency) }); return null; }
  if (now < state.nextAt) return null;
  // Schedule first so a paused/background page never sends a backlog of messages.
  saveLiveState({ ...state, nextAt: now + nextDelay(settings.frequency) });
  return deliverLiveMessage();
}

export const rescheduleLive = (frequency: Frequency) => {
  const state = loadLiveState();
  saveLiveState({ ...state, nextAt: Date.now() + nextDelay(frequency) });
};

/** Unread live messages from any contact, newest first, for lock-screen notifications. */
export const unreadLive = (): Msg[] =>
  readStored<Msg[]>(MSGS_KEY, MESSAGES).filter((m) => m.live && !m.read).reverse();

export const totalUnread = (): number =>
  readStored<Contact[]>(CONTACTS_KEY, CONTACTS).reduce((n, c) => n + (c.unread || 0), 0);

type SeoyunNoticeState = { index: number; nextAt: number };
const SEOYUN_NOTICE_KEY = "kkt-seoyun-notice-state-v1";
const SEOYUN_NOTICES = [
  { ko: "오늘 동아리에서 보니까 앤톤 기분 안 좋아 보이던데, 너희 무슨 일 있어?", zh: "我今天在社团觉得Anton情绪不好，你们怎么啦？", en: "Anton seemed upset at the club today. Did something happen between you two?" },
  { ko: "첼로 연주하다가 음도 몇 번 틀렸어", zh: "他拉琴都拉错好几个音", en: "He even missed quite a few notes while playing cello." },
  { ko: "너희 싸우지 마아아", zh: "你们不要吵架啊啊", en: "Please don't fighttt." },
] as const;

/** Seoyun checks in occasionally after the player chooses the not-blocked ending. */
export function tickSeoyun(now = Date.now()): Msg | null {
  const scene = readAntonScene();
  if (scene.ending !== "not-blocked" || scene.phase !== "done") return null;
  let state: SeoyunNoticeState = { index: 0, nextAt: 0 };
  try { state = { ...state, ...JSON.parse(localStorage.getItem(SEOYUN_NOTICE_KEY) || "{}") }; } catch {}
  if (state.index >= SEOYUN_NOTICES.length) return null;
  if (!state.nextAt) {
    localStorage.setItem(SEOYUN_NOTICE_KEY, JSON.stringify({ ...state, nextAt: now + 18000 }));
    return null;
  }
  if (now < state.nextAt) return null;
  const line = SEOYUN_NOTICES[state.index];
  if (!line) return null;
  const msgs = readStored<Msg[]>(MSGS_KEY, MESSAGES);
  const contacts = readStored<Contact[]>(CONTACTS_KEY, CONTACTS);
  const viewing = activeChat === SEOYUN_CONTACT;
  const msg: Msg = {
    id: `seoyun-after-anton-${state.index + 1}`, contactId: SEOYUN_CONTACT, sender: "them", type: "text",
    ko: line.ko, zh: line.zh, en: line.en, date: STORY_DATE,
    time: new Date(now).toTimeString().slice(0, 5), order: 310000 + state.index,
    live: true, read: viewing, notified: true, createdAt: new Date(now).toISOString(),
  };
  if (!msgs.some((item) => item.id === msg.id)) {
    updateStored<Msg[]>(MSGS_KEY, MESSAGES, (current) => [...current, msg]);
    if (!viewing) updateStored<Contact[]>(CONTACTS_KEY, CONTACTS, (current) =>
      current.map((contact) => contact.id === SEOYUN_CONTACT ? { ...contact, unread: (contact.unread || 0) + 1 } : contact));
    if (!viewing) window.dispatchEvent(new CustomEvent(LIVE_EVENT, { detail: msg }));
  }
  const index = state.index + 1;
  localStorage.setItem(SEOYUN_NOTICE_KEY, JSON.stringify({
    index, nextAt: index >= SEOYUN_NOTICES.length ? 0 : now + (index === 1 ? 26000 : 34000),
  }));
  return msg;
}

export const liveContactName = (): string => read<Contact[]>(CONTACTS_KEY, CONTACTS).find((c) => c.id === LIVE_CONTACT)?.name ?? "Anton";
