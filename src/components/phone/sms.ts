export const SMS_THREADS_KEY = "phone-sms-threads-v1";
export const SMS_MESSAGES_KEY = "phone-sms-messages-v1";
export type SmsThread = { id: string; name: string; number: string; avatar?: string | undefined; contactId?: string };
export type SmsMessage = { id: string; threadId: string; sender: "me" | "them"; text: string; date: string; time: string; image?: string | undefined; ko?: string | undefined; zh?: string | undefined; en?: string | undefined; read?: boolean; source?: "preset" | "player"; order?: number };
export function smsText(message: SmsMessage, lang: "en" | "ko" | "zh") { return message[lang] ?? message.text; }
export function orderSms(messages: SmsMessage[]) { return [...messages].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`) || (a.order ?? 0) - (b.order ?? 0)); }
export function nextSmsTime(messages: SmsMessage[], date: string, clock: string) {
  const last = orderSms(messages).at(-1);
  if (!last || `${date} ${clock}` > `${last.date} ${last.time}`) return { date, time: clock };
  const next = new Date(`${last.date}T${last.time}:00Z`); next.setUTCMinutes(next.getUTCMinutes() + 1);
  return { date: next.toISOString().slice(0, 10), time: next.toISOString().slice(11, 16) };
}
