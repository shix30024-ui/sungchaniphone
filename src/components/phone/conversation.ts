import { STORY_DATE, messageText, nextMessageTime } from "./chronology";
import { CONTACTS, MESSAGES, type Msg } from "./story";
import { LIVE_EVENT, CONTACTS_KEY, MSGS_KEY, notifyStore } from "./live";
import { readStored, updateStored, uid } from "./store";
import type { Lang } from "./i18n";

export const DM_KEY = "ig-dm-messages-v1";
export const QUEUE_KEY = "phone-reply-queue-v1";
export type PendingReply = { channel: "kkt" | "ig"; contactId: string; sourceId: string; dueAt: number };
const lines = {
  food: [
    { ko: "아직 못 먹었어ㅋㅋ 연습 끝나서 이제 뭐 먹으려고. 형은?", zh: "还没吃哈哈，刚练完，正准备找点吃的。哥呢？", en: "Not yet lol, just finished practice. Going to get something. You?" },
    { ko: "그럼 학교 앞에서 먹을까? 멀리 가긴 좀 귀찮아ㅋㅋ", zh: "那在学校门口吃吧？有点懒得跑太远哈哈", en: "Then should we eat by school? Don't feel like going far lol" },
  ],
  music: [
    { ko: "나 지금 베이스 연습 중이야. 형 요즘 무슨 노래 들어?", zh: "我正在练贝斯。哥最近在听什么歌？", en: "Practicing bass right now. What have you been listening to?" },
    { ko: "제목 보내줘. 연습 끝나면 들어볼게ㅋㅋ", zh: "把歌名发我吧，练完就听哈哈", en: "Send me the title. I'll listen after practice lol" },
  ],
  sleep: [
    { ko: "졸리면 먼저 자 형. 나도 씻고 잘게", zh: "困了就先睡吧哥，我也洗洗准备睡了", en: "Sleep first if you're tired, hyung. I'll shower and head to bed too" },
    { ko: "내일 얘기하자ㅋㅋ 잘 자", zh: "明天聊吧哈哈，晚安", en: "Let's talk tomorrow lol. Good night" },
  ],
  plans: [
    { ko: "목요일은 연습 끝나고 괜찮아. 형 몇 시에 끝나?", zh: "周四练完有空，哥几点结束？", en: "I'm free after practice Thursday. When do you finish?" },
    { ko: "그럼 끝나고 연락할게. 정문에서 볼까?", zh: "那结束了联系你，在正门见吗？", en: "I'll text when I'm done then. Meet at the main gate?" },
  ],
  tired: [
    { ko: "오늘 많이 힘들었어? 잠깐 쉬어 형", zh: "今天很累吗？哥先休息一会儿", en: "Was today rough? Take a break, hyung" },
    { ko: "과제는 조금 있다 해도 되잖아. 물이라도 마셔", zh: "作业晚一点做也行嘛，先喝点水", en: "The assignment can wait a little. At least get some water" },
  ],
  hello: [
    { ko: "형ㅋㅋ 지금 집이야?", zh: "哥哈哈，现在在家吗？", en: "Hyung lol, are you home?" },
    { ko: "나 잠깐 쉬는 중. 형 뭐 하고 있었어?", zh: "我正在休息一会儿，哥刚才在干嘛？", en: "Taking a short break. What were you doing?" },
  ],
};
type Topic = keyof typeof lines;
function topic(text: string): Topic | undefined {
  if (/밥|먹|저녁|점심|饭|吃|饿|food|eat|dinner|lunch|hungry/i.test(text)) return "food";
  if (/노래|연습|베이스|첼로|음악|歌|练|音乐|music|song|practice|bass|cello/i.test(text)) return "music";
  if (/자|졸|睡|晚安|sleep|bed|night/i.test(text)) return "sleep";
  if (/목요일|만나|시간|见|有空|周四|meet|free|thursday/i.test(text)) return "plans";
  if (/힘들|과제|피곤|累|作业|tired|rough|assignment/i.test(text)) return "tired";
  if (/안녕|뭐해|你好|在干嘛|hello|hey|hi\b/i.test(text)) return "hello";
  return undefined;
}

/** Local contextual presets, not an AI service. No changes to source messages. */
export function contextualReply(thread: Msg[], source: Msg) {
  const sourceText = source.originalText ?? [source.ko, source.zh, source.en].filter(Boolean).join(" ");
  const recent = thread.filter((m) => m.type === "text").slice(-6);
  const chosen = topic(sourceText) ?? recent.map((m) => topic(m.originalText ?? `${m.ko} ${m.zh} ${m.en ?? ""}`)).reverse().find(Boolean);
  const previous = recent.filter((m) => m.sender === "them" && m.replyKind === "preset");
  if (chosen) {
    const options = lines[chosen];
    return options[previous.length % options.length] ?? options[0];
  }
  const excerpt = sourceText.length > 48 ? `${sourceText.slice(0, 48)}…` : sourceText;
  return previous.length % 2 === 0
    ? { ko: `“${excerpt}” 그랬구나. 그 다음엔 어떻게 됐어?`, zh: `“${excerpt}” 原来这样，后来呢？`, en: `“${excerpt}” Oh, I see. What happened after that?` }
    : { ko: `“${excerpt}” 응 읽었어. 형은 어떻게 생각해?`, zh: `“${excerpt}” 嗯，我看到了。哥怎么想？`, en: `“${excerpt}” Yeah, I read it. What do you think?` };
}

export function pendingReplies(): PendingReply[] { return readStored<PendingReply[]>(QUEUE_KEY, []); }
export function sendChat(channel: "kkt" | "ig", contactId: string, text: string, lang: Lang, now = Date.now()) {
  const key = channel === "kkt" ? MSGS_KEY : DM_KEY;
  const fallback = channel === "kkt" ? MESSAGES : [];
  const existing = readStored<Msg[]>(key, fallback);
  const msg: Msg = { id: uid(), contactId, sender: "me", type: "text", ko: lang === "ko" ? text : "", zh: lang === "zh" ? text : "", en: lang === "en" ? text : "", originalText: text, date: STORY_DATE, time: nextMessageTime(existing), order: Math.max(0, ...existing.map((m) => m.order)) + 1, read: false };
  updateStored<Msg[]>(key, fallback, (rows) => [...rows, msg]);
  if (channel === "ig" || contactId === "anton") {
    updateStored<PendingReply[]>(QUEUE_KEY, [], (q) => [...q, { channel, contactId, sourceId: msg.id, dueAt: now + 2400 + Math.min(text.length * 20, 1600) }]);
  }
  return msg;
}

export function tickReplies(now = Date.now(), activeKkt: string | null = null) {
  const queue = pendingReplies();
  const item = queue.find((q) => q.dueAt <= now);
  if (!item) return null;
  const key = item.channel === "kkt" ? MSGS_KEY : DM_KEY;
  const fallback = item.channel === "kkt" ? MESSAGES : [];
  const rows = readStored<Msg[]>(key, fallback);
  const source = rows.find((m) => m.id === item.sourceId);
  const id = `reply-${item.sourceId}`;
  if (!source || rows.some((m) => m.id === id)) {
    updateStored<PendingReply[]>(QUEUE_KEY, [], (q) => q.filter((p) => p.sourceId !== item.sourceId));
    return null;
  }
  let reply = contextualReply(rows.filter((m) => m.contactId === item.contactId), source);
  if (item.channel === "ig" && item.contactId !== "anton") {
    const sourceText = messageText(source, "en");
    reply = item.contactId === "minjae"
      ? { ko: `“${sourceText}” ㅋㅋ 알겠어. 내일 운동장 올 거야?`, zh: `“${sourceText}” 哈哈知道啦，明天来球场吗？`, en: `“${sourceText}” Haha, got it. Coming to the pitch tomorrow?` }
      : { ko: `“${sourceText}” 확인! 과제 끝나고 다시 연락할게`, zh: `“${sourceText}” 收到！写完作业再联系你`, en: `“${sourceText}” Got it! I'll text after finishing my assignment` };
  }
  const incoming: Msg = { ...reply, id, contactId: item.contactId, sender: "them", type: "text", date: STORY_DATE, time: nextMessageTime(rows), order: Math.max(0, ...rows.map((m) => m.order)) + 1, replyTo: source.id, replyKind: "preset", live: item.channel === "kkt", read: item.channel === "kkt" && activeKkt === item.contactId };
  updateStored<Msg[]>(key, fallback, (current) => [...current.map((m) => m.id === source.id ? { ...m, read: true } : m), incoming]);
  updateStored<PendingReply[]>(QUEUE_KEY, [], (q) => q.filter((p) => p.sourceId !== item.sourceId));
  if (item.channel === "kkt" && activeKkt !== item.contactId) {
    updateStored(CONTACTS_KEY, CONTACTS, (current) => current.map((c) => c.id === item.contactId ? { ...c, unread: c.unread + 1 } : c));
    window.dispatchEvent(new CustomEvent(LIVE_EVENT, { detail: incoming }));
  }
  notifyStore(key);
  return incoming;
}