import type { Msg } from "./story";

// Only an exact original text match may receive a missing translation.
// Explicitly saved translations, including intentionally empty drafts, remain untouched.
const english: Record<string, string> = {};
export function completeTranslations(messages: Msg[]): Msg[] {
  return messages.map((message) => message.en === undefined && english[message.ko]
    ? { ...message, en: english[message.ko] }
    : message);
}