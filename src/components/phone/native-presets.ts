import { CONTACTS } from "./story";
import { RECENTS_KEY, type RecentCall } from "./contacts";
import { SMS_MESSAGES_KEY, SMS_THREADS_KEY, type SmsMessage, type SmsThread } from "./sms";
import { backupPhoneData, readStored } from "./store";

export const NATIVE_PRESETS_KEY = "phone-native-presets-added-v1";
export const PRESET_CALLS: RecentCall[] = [
  { id: "native-call-anton-1", contactId: "anton", name: "찬영 Anton", time: "2026-10-26T04:45:00Z", direction: "incoming", duration: 86 },
  { id: "native-call-anton-2", contactId: "anton", name: "찬영 Anton", time: "2026-10-25T10:10:00Z", direction: "missed" },
  { id: "native-call-anton-3", contactId: "anton", name: "찬영 Anton", time: "2026-10-25T10:14:00Z", direction: "outgoing", duration: 124 },
  { id: "native-call-minjae", contactId: "minjae", name: "김민재", time: "2026-10-24T07:20:00Z", direction: "outgoing", duration: 42 },
  { id: "native-call-doyun", contactId: "doyun", name: "박도윤", time: "2026-10-23T02:35:00Z", direction: "incoming", duration: 65 },
];
export const PRESET_THREADS: SmsThread[] = ["anton", "minjae", "doyun"].map((id) => {
  const contact = CONTACTS.find((c) => c.id === id);
  return { id: `contact-${id}`, contactId: id, name: contact?.name ?? id, number: "", avatar: contact?.avatar ?? "" };
});
const sms = (id: string, contact: string, sender: "me" | "them", date: string, time: string, ko: string, zh: string, en: string): SmsMessage =>
  ({ id, threadId: `contact-${contact}`, sender, date, time, text: ko, ko, zh, en, source: "preset", read: sender === "me" });
export const PRESET_SMS: SmsMessage[] = [
  sms("native-sms-anton-1", "anton", "them", "2026-10-26", "13:02", "형 나 정문 도착했어", "哥，我到正门了。", "Hyung, I'm at the main gate."),
  sms("native-sms-anton-2", "anton", "me", "2026-10-26", "13:03", "나도 곧 내려가. 거기서 잠깐 기다려", "我也马上下去，在那里等一下。", "I'll be down soon. Wait there a moment."),
  sms("native-sms-anton-3", "anton", "them", "2026-10-26", "13:04", "응 천천히 와", "嗯，慢慢来。", "Okay, take your time."),
  sms("native-sms-minjae-1", "minjae", "them", "2026-10-24", "16:05", "오늘 풋살 공 내가 가져갈게", "今天踢球的球我来带。", "I'll bring the ball for futsal today."),
  sms("native-sms-minjae-2", "minjae", "me", "2026-10-24", "16:08", "고마워. 체육관 앞에서 보자", "谢啦，体育馆门口见。", "Thanks. See you outside the gym."),
  sms("native-sms-doyun-1", "doyun", "them", "2026-10-23", "11:40", "조별 과제 자료 메일로 보냈어. 시간 될 때 확인해 줘", "小组作业的资料发邮箱了，有空看一下。", "I emailed the group project materials. Check when you have time."),
];

/** Append once; never reseed deleted records or rewrite an existing conversation. */
export function ensureNativePresets() {
  if (localStorage.getItem(NATIVE_PRESETS_KEY)) return;
  const calls = readStored<RecentCall[]>(RECENTS_KEY, []);
  const threads = readStored<SmsThread[]>(SMS_THREADS_KEY, []);
  const messages = readStored<SmsMessage[]>(SMS_MESSAGES_KEY, []);
  // Parse every source before writing anything: malformed saved data stays untouched.
  if (!Array.isArray(calls) || !Array.isArray(threads) || !Array.isArray(messages)) return;
  const addedThreads = PRESET_THREADS.filter((preset) => !threads.some((t) => t.id === preset.id || t.contactId === preset.contactId));
  const addedIds = new Set(addedThreads.map((t) => t.id));
  backupPhoneData();
  localStorage.setItem(RECENTS_KEY, JSON.stringify([...calls, ...PRESET_CALLS.filter((c) => !calls.some((old) => old.id === c.id))]));
  localStorage.setItem(SMS_THREADS_KEY, JSON.stringify([...threads, ...addedThreads]));
  localStorage.setItem(SMS_MESSAGES_KEY, JSON.stringify([...messages, ...PRESET_SMS.filter((m) => addedIds.has(m.threadId) && !messages.some((old) => old.id === m.id))]));
  localStorage.setItem(NATIVE_PRESETS_KEY, "true");
  for (const key of [RECENTS_KEY, SMS_THREADS_KEY, SMS_MESSAGES_KEY]) window.dispatchEvent(new CustomEvent("phone-store", { detail: key }));
}