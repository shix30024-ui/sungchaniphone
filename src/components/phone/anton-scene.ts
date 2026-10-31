import type { Lang } from "./i18n";
import { MESSAGES, type Msg } from "./story";
import { readStored, uid } from "./store";
import { readTemporaryReplies, writeTemporaryReplies, type TemporaryReply } from "./fixed-conversation";

export type AntonScenePhase =
  | "first-replies"
  | "choose-ending"
  | "anton-typing"
  | "final-replies"
  | "blocked"
  | "done";

export type AntonSceneState = {
  started: boolean;
  phase: AntonScenePhase;
  firstReplyCount: number;
  finalReplyCount: number;
  antonReplyCount: number;
  ending: "blocked" | "not-blocked" | null;
  freeMessageCount: number;
};

const INITIAL: AntonSceneState = {
  started: false,
  phase: "first-replies",
  firstReplyCount: 0,
  finalReplyCount: 0,
  antonReplyCount: 0,
  ending: null,
  freeMessageCount: 0,
};

// Module memory only: progress survives switching apps, but a page refresh restarts this scene.
let scene: AntonSceneState = { ...INITIAL };
export const readAntonScene = () => scene;
export const updateAntonScene = (patch: Partial<AntonSceneState>) => {
  scene = { ...scene, ...patch };
  return scene;
};
export const resetAntonScene = () => { scene = { ...INITIAL }; };

export const ANTON_OPENING = [
  { zh: "哥有女朋友了？", ko: "형 여자친구 생겼어?", en: "Hyung, do you have a girlfriend?" },
  { zh: "不告诉我啊hh", ko: "나한테는 말 안 해줬네 hh", en: "You didn't tell me hh" },
  { zh: "哥不是喜欢我吗？ 有女朋友了为什么还每天抱我？", ko: "형 나 좋아하는 거 아니었어? 여자친구 생겼으면서 왜 매일 나 안아 줘?", en: "Didn't you like me, hyung? Why do you still hug me every day if you have a girlfriend?" },
  { zh: "哥以后别再来找我了。", ko: "형 이제 나 찾아오지 마.", en: "Don't come see me anymore, hyung." },
] as const;

export const ANTON_AFTER_REASSURANCE = [
  { zh: "学妹吗？", ko: "후배?", en: "A junior?" },
  { zh: "哈哈哥要是有喜欢的女生一定要告诉我啊^", ko: "ㅋㅋ 형 좋아하는 여자 생기면 꼭 나한테 말해 줘^", en: "Haha, hyung, if you ever like a girl, make sure you tell me^" },
  { zh: "我不介意的：）", ko: "난 괜찮아 :)", en: "I don't mind :)" },
  { zh: "真的。", ko: "진짜야.", en: "Really." },
] as const;

export const FIRST_PLAYER_REPLIES = [
  { zh: "？", ko: "?", en: "?" },
  { zh: "谁说的我有女朋友了", ko: "누가 나 여자친구 있다고 했어?", en: "Who said I have a girlfriend?" },
  { zh: "那只是一个学妹 我跟他不熟", ko: "그냥 후배야. 나랑 별로 안 친해.", en: "She's just a junior. I don't know her that well." },
  { zh: "呀李灿荣", ko: "야 이찬영", en: "Hey, Lee Chanyoung." },
] as const;

export const FINAL_PLAYER_REPLIES = [
  { zh: "不是", ko: "아니야", en: "No." },
  { zh: "我真的没有", ko: "나 진짜 없어", en: "I really don't." },
  { zh: "我最最最喜欢anton了", ko: "난 앤톤을 제일 제일 좋아해", en: "I like Anton the most. More than anyone." },
  { zh: "你不是知道吗？", ko: "너도 알고 있잖아?", en: "You know that, don't you?" },
] as const;

export function makeAntonSceneMessage(
  text: { zh: string; ko: string; en: string },
  after?: Msg,
  read = true,
): TemporaryReply {
  const now = new Date();
  return {
    afterId: after?.id,
    message: {
      id: `anton-scene-${uid()}`, contactId: "anton", sender: "them", type: "text",
      ko: text.ko, zh: text.zh, en: text.en, date: "2026-10-31",
      time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      order: (after?.order ?? 0) + 1, read,
    },
  };
}

/** Deliver Anton’s opening burst while the player is on the unlocked home screen. */
export function startAntonScene(): Msg[] {
  if (scene.started) return [];
  const saved = readStored<Msg[]>("kkt-msgs-v1", MESSAGES).filter((m) => m.contactId === "anton");
  let anchor = [...saved].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`) || (a.order ?? 0) - (b.order ?? 0)).at(-1);
  const additions: TemporaryReply[] = [];
  for (const line of ANTON_OPENING) {
    const item = makeAntonSceneMessage(line, anchor, false);
    additions.push(item);
    anchor = item.message;
  }
  writeTemporaryReplies("anton", [...readTemporaryReplies("anton"), ...additions]);
  updateAntonScene({ started: true, phase: "first-replies", firstReplyCount: 0, finalReplyCount: 0, antonReplyCount: 0, ending: null });
  return additions.map((item) => item.message);
}

export function makeAntonSceneSystem(text: string, lang: Lang, after?: Msg): TemporaryReply {
  const now = new Date();
  return {
    afterId: after?.id,
    message: {
      id: `anton-scene-system-${uid()}`, contactId: "anton", sender: "them", type: "system",
      ko: lang === "ko" ? text : "", zh: lang === "zh" ? text : "", en: lang === "en" ? text : "",
      originalText: text, date: "2026-10-31",
      time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      order: (after?.order ?? 0) + 1, read: true,
    },
  };
}
