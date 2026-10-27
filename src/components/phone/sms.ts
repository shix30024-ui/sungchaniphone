export const SMS_THREADS_KEY = "phone-sms-threads-v1";
export const SMS_MESSAGES_KEY = "phone-sms-messages-v1";
export type SmsThread = { id: string; name: string; number: string; avatar?: string };
export type SmsMessage = { id: string; threadId: string; sender: "me" | "them"; text: string; date: string; time: string; image?: string; ko?: string; zh?: string; en?: string };
export function smsText(message: SmsMessage, lang: "en" | "ko" | "zh") { return message[lang] ?? message.text; }
export function orderSms(messages: SmsMessage[]) { return [...messages].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)); }
