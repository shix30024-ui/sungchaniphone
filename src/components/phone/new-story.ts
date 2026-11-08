import type { Lang } from "./i18n";
import { sharedRead, sharedWrite, queueSharedSave } from "./shared-state";

export type StoryText = Record<Lang, string>;
export type NewStoryState = {
  stage: number;
  openingReplies: number;
  reassuranceReplies: number;
  stage2Replies: number;
  stage2Reassurance: number;
  finalReplies: number;
  seoyunReplies: number;
  seoyunStep: number;
  yunaDmSent: boolean;
  xPostPublished: boolean;
  xReplySent: boolean;
  antonStoryViewed: boolean;
  stage4Step: number;
  stage6Step: number;
  yunaPostRemoved: boolean;
  endingPosted: boolean;
};

const INITIAL: NewStoryState = {
  stage: 0, openingReplies: 0, reassuranceReplies: 0, stage2Replies: 0, stage2Reassurance: 0, finalReplies: 0,
  seoyunReplies: 0, seoyunStep: 0, yunaDmSent: false, xPostPublished: false, xReplySent: false,
  antonStoryViewed: false, stage4Step: 0, stage6Step: 0, yunaPostRemoved: false, endingPosted: false,
};

// Story progress is stored separately from the owner's phone content.
// This keeps the story stage across refreshes without rewriting chats, posts, or contacts.
const STORAGE_KEY = "fiction-story-progress-v1";
const EVENT = "fiction-story-update";
function mergeStoryState(base: NewStoryState, next: Partial<NewStoryState>): NewStoryState {
  const merged = { ...base, ...next };
  const counters: (keyof NewStoryState)[] = [
    "stage", "openingReplies", "reassuranceReplies", "stage2Replies", "stage2Reassurance",
    "finalReplies", "seoyunReplies", "seoyunStep", "stage4Step", "stage6Step",
  ];
  for (const key of counters) {
    merged[key] = Math.max(Number(base[key]) || 0, Number(next[key]) || 0) as never;
  }
  const flags: (keyof NewStoryState)[] = [
    "yunaDmSent", "xPostPublished", "xReplySent", "antonStoryViewed", "yunaPostRemoved", "endingPosted",
  ];
  for (const key of flags) merged[key] = Boolean(base[key] || next[key]) as never;
  return merged;
}

function readSavedArray(key: string): unknown[] {
  try {
    const shared = sharedRead(key);
    const raw = shared.found ? shared.value : localStorage.getItem(key);
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function persistStoryState(value: NewStoryState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* Keep phone content independent of story progress. */ }
  if (!sharedWrite(STORAGE_KEY, value)) queueSharedSave(STORAGE_KEY, value);
}

function loadStoryState(): NewStoryState {
  if (typeof window === "undefined") return { ...INITIAL };
  let loaded = { ...INITIAL };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) loaded = mergeStoryState(loaded, JSON.parse(raw) as Partial<NewStoryState>);
  } catch { /* Continue with other independent recovery evidence. */ }
  try {
    const shared = sharedRead(STORAGE_KEY);
    if (shared.found && shared.value && typeof shared.value === "object") {
      loaded = mergeStoryState(loaded, shared.value as Partial<NewStoryState>);
    }
  } catch { /* Local progress remains available. */ }

  // Recover only from durable artifacts that prove a story event actually happened.
  const dmMessages = readSavedArray("ig-dm-messages-v1") as Array<{ id?: string }>;
  if (dmMessages.some((message) => message.id === "new-story-yuna-reply-4")) {
    loaded = mergeStoryState(loaded, { stage: 10, yunaDmSent: true, yunaPostRemoved: true });
  }

  // Seoyun's scripted plot messages are saved in the durable KKT message
  // collection (not the temporary-reply cache). Recover only from the final
  // incoming message so an interrupted progress write cannot hide Anton's story.
  const savedKktMessages = readSavedArray("kkt-msgs-v1") as Array<{ id?: string; contactId?: string }>;
  if (savedKktMessages.some((message) => message.contactId === "seoyun" && message.id === "story3-seoyun-in-6-4")) {
    loaded = mergeStoryState(loaded, { stage: 7, seoyunStep: 7 });
  }

  const seenStories = readSavedArray("ig-story-seen-v1") as string[];
  if (seenStories.includes("new-story-anton-20261031")) {
    loaded = mergeStoryState(loaded, { stage: 8, antonStoryViewed: true });
  }

  try {
    if (localStorage.getItem("ig-follow-yuna-v1") === "true") {
      loaded = mergeStoryState(loaded, { stage: 2 });
    }
  } catch { /* Optional recovery marker. */ }

  return loaded;
}

let state: NewStoryState = loadStoryState();

if (typeof window !== "undefined") {
  window.addEventListener("phone-shared-refresh", () => {
    const refreshed = loadStoryState();
    if (JSON.stringify(refreshed) !== JSON.stringify(state)) {
      state = refreshed;
      window.dispatchEvent(new CustomEvent(EVENT, { detail: { ...state } }));
    }
  });
}

export const readNewStory = () => {
  const recovered = loadStoryState();
  if (JSON.stringify(recovered) !== JSON.stringify(state)) {
    state = recovered;
    persistStoryState(state);
  }
  return { ...state };
};
export function updateNewStory(patch: Partial<NewStoryState>) {
  state = { ...state, ...patch };
  if (typeof window !== "undefined") {
    persistStoryState(state);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: readNewStory() }));
  }
  return readNewStory();
}
export function subscribeNewStory(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
export const NEW_STORY_EVENT = EVENT;

export const OPENING_ANTON: StoryText[] = [
  { ko: "오늘 첼로 치다가 형 생각났어", zh: "今天在拉大提琴的时候想到哥了", en: "I thought of you while playing the cello today." },
  { ko: "형 요즘 너무 바쁜 것 같아", zh: "感觉你好忙", en: "You seem so busy lately." },
  { ko: "연락도 안 하고", zh: "都不联系我", en: "You don't even text me." },
];
export const OPENING_CHOICES: StoryText[] = [
  { ko: "어디가 바빠 ㅎㅎ", zh: "哪有", en: "I'm not that busy." },
  { ko: "우리 천사가 오랜만에 보고 싶다고 하네", zh: "我们天使久违地说想我啊", en: "Our angel finally says he misses me." },
  { ko: "형도 많이 보고 싶었어", zh: "哥也好想你了", en: "I missed you too." },
];
export const OPENING_ANTON_2: StoryText = { ko: "형 요즘 뭐 해?", zh: "哥最近在忙什么", en: "What have you been busy with lately?" };
export const OPENING_CHOICES_2: StoryText[] = [
  { ko: "요즘 축제 준비하느라 바빠", zh: "最近在忙校庆", en: "I've been busy preparing for the campus festival." },
  { ko: "너무 피곤해", zh: "好累", en: "I'm exhausted." },
  { ko: "천사 안고 충전하고 싶어", zh: "想抱着天使充电", en: "I want to recharge by hugging you." },
];
export const OPENING_ANTON_3: StoryText = { ko: "이따 우리 집 올래?:)", zh: "待会来家里吧:)", en: "Want to come over later?:)" };

export const STAGE2_ANTON: StoryText[] = [
  { ko: "형 오늘 축제 누구랑 같이 있었어?", zh: "哥今天和谁在一起去校庆了？", en: "Who were you with at the festival today?" },
  { ko: "나한테는 말 안 해 주네 hh", zh: "不告诉我啊hh", en: "You won't tell me, huh hh." },
  { ko: "형은 누구한테나 그렇게 다정해?", zh: "哥跟谁都这么亲近吗？", en: "Are you that affectionate with everyone?" },
  { ko: "여자친구야?", zh: "是女朋友吗", en: "Is she your girlfriend?" },
  { ko: "됐어 나도 알고 싶지 않아", zh: "算了我也不想知道", en: "Forget it. I don't want to know." },
];
export const STAGE2_CHOICES: StoryText[] = [
  { ko: "?", zh: "？", en: "?" },
  { ko: "나 혼자였어", zh: "我一个人啊", en: "I was alone." },
  { ko: "무슨 말이야", zh: "你在说什么", en: "What are you talking about?" },
  { ko: "무슨 말인지 모르겠어", zh: "我听不懂", en: "I don't understand." },
];
export const STAGE2_REASSURE: StoryText[] = [
  { ko: "왜 전화 안 받아", zh: "为什么不接电话", en: "Why aren't you answering?" },
  { ko: "여자친구 같은 거 없어", zh: "哪有什么女朋友", en: "I don't have a girlfriend." },
  { ko: "그 게시물 본 거지?", zh: "是你看到那个帖子了吧？", en: "You saw that post, didn't you?" },
];

export const SEOYUN_STAGE3: StoryText[] = [
  { ko: "오늘 동아리에서 앤톤 기분 안 좋아 보이던데", zh: "今天在社团anton情绪不高哦", en: "Anton seemed upset at the club today." },
  { ko: "너희 무슨 일 있어? 너 여자친구 생겼어???", zh: "你们怎么了？你有女朋友？？？", en: "What happened between you two? Do you have a girlfriend???" },
  { ko: "첼로 연주하다가 음도 몇 번 틀렸어!", zh: "他拉琴拉错好几个音！", en: "He even missed several notes while playing cello!" },
  { ko: "ㅅㅂ", zh: "ㅅㅂ", en: "Damn." },
  { ko: "너 뭐 하는 거야!", zh: "你搞什么!", en: "What are you doing!" },
  { ko: "도촬 당한 것도 몰랐어?", zh: "被人偷拍都不知道", en: "You didn't even know someone took that photo?" },
  { ko: "너 진짜 웃음이 나와?", zh: "你居然笑得出来？", en: "You can actually laugh right now?" },
  { ko: "완전 상처 주네", zh: "简直杀人诛心", en: "That's honestly brutal." },
  { ko: "내 CP 이제 끝이야?", zh: "我的cp要be了", en: "Is my favorite ship over?" },
  { ko: "나 너랑 말 안 해", zh: "我不跟你好了", en: "I'm not talking to you." },
];

export const SEOYUN_PLAYER_STAGE3: StoryText[] = [
  { ko: "후배가 내 뒷모습 나온 인스타 게시물을 올렸어", zh: "有学妹发了ig是我的背影", en: "A junior posted an Instagram photo of my back." },
  { ko: "앤톤은 그걸 여자친구라고 생각했어", zh: "他以为是女朋友", en: "Anton thought she was my girlfriend." },
  { ko: "...", zh: "…", en: "..." },
  { ko: "이제 나한테 답도 안 해 ㅎㅎ", zh: "他现在都不理我了ㅎㅎ", en: "He isn't replying to me now eitherㅎㅎ" },
];

export const STAGE4_ANTON: StoryText[] = [
  { ko: "스토리 올리면서 내 메시지는 안 읽어?", zh: "发快拍都不回我信息？", en: "You can post a story but not reply to me?" },
  { ko: "그냥 답하기 싫었어", zh: "就是不想", en: "I just didn't want to." },
  { ko: "응", zh: "嗯？", en: "Yeah?" },
  { ko: "형은 원래 먼저 다가가는 사람 아니잖아", zh: "哥不算主动的人", en: "You're not usually the one to make the first move." },
  { ko: "근데 너한테는 예외였어", zh: "可是对你破例了啊..", en: "But I made an exception for you.." },
  { ko: "형이 너 좋아하는 거 알잖아", zh: "哥喜欢你你是知道的啊", en: "You know I like you." },
  { ko: "왜 그런 착각을 하게 됐어?", zh: "怎么还会出现这样的错觉", en: "Why would you think otherwise?" },
  { ko: "형 주변엔 여자애들이 많잖아", zh: "哥身边有好多女孩子", en: "There are so many girls around you." },
  { ko: "그래서 자꾸 헷갈렸어", zh: "所以总是会产生错觉", en: "So I kept getting confused." },
  { ko: "형은 어떤 여자가 좋아? 나한텐 어떤 마음이야?", zh: "哥喜欢什么样的女生？哥对我又是什么想法", en: "What kind of girl do you like? What do you feel for me?" },
  { ko: "그런 생각 자주 했어", zh: "经常这样想", en: "I think about that a lot." },
  { ko: "물어보기가 무서웠어", zh: "不敢问", en: "I was afraid to ask." },
  { ko: "나 봐", zh: "看看", en: "Look at me." },
  { ko: "천사가 형 좋아하는 거", zh: "天使喜欢我", en: "You like me." },
  { ko: "맞지?", zh: "对吗？", en: "Right?" },
  { ko: "그냥 그런 거 말고", zh: "不是那种喜欢", en: "Not just that kind of like." },
  { ko: "무슨 말인지 알잖아", zh: "你知道哥再说什么", en: "You know what I mean." },
  { ko: "eh", zh: "eh", en: "eh" },
  { ko: "응", zh: "응", en: "Yeah." },
];

export const STAGE4_PLAYER_CHOICES: StoryText[] = [
  { ko: "스토리 올리면서 내 메시지는 안 읽어?", zh: "发快拍都不回我信息？", en: "You can post a story but not reply to me?" },
  { ko: "천사", zh: "天使", en: "Angel." },
  { ko: "우리 얘기 좀 하자", zh: "我们要把话说开啊", en: "We need to talk this through." },
  { ko: "응?", zh: "嗯？", en: "Hm?" },
  { ko: "형은 원래 먼저 다가가는 사람 아니잖아", zh: "哥不算主动的人", en: "You're not usually the one to make the first move." },
  { ko: "근데 너한테는 예외였어..", zh: "可是对你破例了啊..", en: "But I made an exception for you.." },
  { ko: "형이 너 좋아하는 거 알잖아", zh: "哥喜欢你你是知道的啊", en: "You know I like you." },
  { ko: "왜 그런 착각을 하게 됐어?", zh: "怎么还会出现这样的错觉", en: "Why would you think otherwise?" },
  { ko: "나 봐", zh: "看看", en: "Look at me." },
  { ko: "천사가 형 좋아하는 거", zh: "天使喜欢我", en: "You like me." },
  { ko: "맞지?", zh: "对吗？", en: "Right?" },
  { ko: "그냥 그런 거 말고", zh: "不是那种喜欢", en: "Not just that kind of like." },
  { ko: "무슨 말인지 알잖아", zh: "你知道哥再说什么", en: "You know what I mean." },
];

export const STAGE5_YUNA_REPLY: StoryText[] = [
  { ko: "남자친구…?", zh: "男朋友…?", en: "Boyfriend…?" },
  { ko: "미안해요 몰랐어요", zh: "抱歉我不知道", en: "I'm sorry, I didn't know." },
  { ko: "성찬 선배는 여자 좋아하는 줄 알았어요", zh: "一直以为成灿哥性取向是女生来着", en: "I always thought you liked girls, sunbaenim." },
  { ko: "삭제할게요!", zh: "我会删除的！", en: "I'll delete it!" },
];

export const STAGE6_ANTON: StoryText[] = [
  { ko: "?", zh: "？", en: "?" },
  { ko: "형 남자친구가 누구야?", zh: "谁是男朋友", en: "Who is your boyfriend?" },
  { ko: "뭐야 진짜!!", zh: "好奇怪！！", en: "That's so weird!!" },
  { ko: "누가 형이랑 사귄대?", zh: "谁说要和你在一起了", en: "Who said I'd date you?" },
  { ko: ":)", zh: ":)", en: ":)" },
  { ko: "알았어", zh: "知道了", en: "I know." },
  { ko: "남자친구", zh: "男朋友", en: "Boyfriend." },
  { ko: "보고 싶어", zh: "想你了", en: "I miss you." },
];

export const PLAYER_CHOICES_STAGE2 = STAGE2_CHOICES;
export const PLAYER_CHOICES_STAGE4: StoryText[] = [
  { ko: "천사", zh: "天使", en: "Angel." },
  { ko: "우리 얘기 좀 하자", zh: "我们要把话说开啊", en: "We need to talk this through." },
  { ko: "응?", zh: "嗯？", en: "Hm?" },
];
export const PLAYER_CHOICES_STAGE6: StoryText[] = [
  { ko: "학妹 게시물은 삭제해 달라고 했어", zh: "学妹的那条帖子已经让她删除了", en: "I asked her to take the post down." },
  { ko: "내 남자친구가 화났다고도 했고", zh: "也告诉他我的小男朋友生气了", en: "And I told her my boyfriend was upset." },
  { ko: "천사", zh: "天使", en: "Angel." },
  { ko: "그래서 형이랑 사귈래?", zh: "所以愿意和哥在一起吗？", en: "So, will you be with me?" },
];
