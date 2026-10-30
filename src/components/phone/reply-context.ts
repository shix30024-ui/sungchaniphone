import type { Msg } from "./story";
import { sortMessages } from "./chronology";

type Text = { ko: string; zh: string; en: string };
const answer = (ko: string, zh: string, en: string): Text => ({ ko, zh, en });
const contains = (text: string, expression: RegExp) => expression.test(text);
const textOf = (m: Msg) => m.originalText ?? `${m.ko} ${m.zh} ${m.en ?? ""}`;

function choose<T>(items: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return items[hash % items.length];
}

const tired = /피곤|힘들|지쳤|累|疲惫|tired|exhausted|rough day/i;
const food = /먹|밥|식사|吃|饭|饿|\beat\b|eaten|dinner|lunch|hungry|food/i;
const music = /연습|베이스|첼로|음악|노래|练|贝斯|大提琴|音乐|歌|practice|practicing|bass|cello|music|song/i;
const school = /수업|과제|시험|교수|학교|作业|上课|考试|学校|assignment|class|exam|lecture/i;
const plan = /만나|약속|정문|见面|约好|正门|meet|plan|date|tomorrow|내일|明天/i;

/** Shared lightweight local fallback for Instagram. */
export function replyFromContext(thread: Msg[], source: Msg): Text {
  return contextualReply(thread, source, "ig");
}

/** KKT-specific conversational fallback. Uses recent turns to avoid repeating itself. */
export function replyFromKktContext(thread: Msg[], source: Msg): Text {
  return contextualReply(thread, source, "kkt");
}

function contextualReply(thread: Msg[], source: Msg, channel: "ig" | "kkt"): Text {
  const ordered = sortMessages(thread);
  const index = ordered.findIndex((m) => m.id === source.id);
  const history = ordered.slice(0, index < 0 ? ordered.length : index)
    .filter((m) => m.type === "text" || m.type === "image").slice(-18);
  const current = textOf(source).trim();
  const playerTurns = history.filter((m) => m.sender === "me");
  const antonTurns = history.filter((m) => m.sender === "them");
  const lastAnton = antonTurns.at(-1);
  const lastAntonText = lastAnton ? textOf(lastAnton) : "";
  const lastPlayer = playerTurns.at(-1);
  const lastPlayerText = lastPlayer ? textOf(lastPlayer) : "";
  const seed = source.id || current;
  const priorReplies = antonTurns.slice(-4).map(textOf).join(" ");
  const fresh = <T,>(items: T[], signatures: RegExp[]): T[] => {
    const filtered = items.filter((_, i) => !signatures[i] || !signatures[i]!.test(priorReplies));
    return filtered.length ? filtered : items;
  };

  if (source.type === "image") return choose([
    answer("오 이거 언제 찍었어ㅋㅋ", "哦，这是什么时候拍的ㅋㅋ", "Oh, when did you take this? haha"),
    answer("사진 보니까 나도 거기 가고 싶네", "看了照片我也想去那里了", "This makes me want to go there too"),
  ], seed);

  // Answer the question Anton actually asked, instead of restarting the topic.
  if (contains(lastAntonText, /무슨 일|发生什么|what happened|괜찮아\?/i) && contains(current, tired)) {
    return choose([
      answer("아 그랬구나. 그건 형 입장에서도 신경 쓰였겠다", "啊，原来是这样。站在哥的角度，确实会很在意吧", "Ah, I see. I can understand why that got to you"),
      answer("그 얘기 들으니까 왜 힘들었는지 알 것 같아. 지금은 좀 풀렸어?", "听你这么说，我大概明白为什么这么累了。现在好些了吗？", "Hearing that, I get why it was tiring. Has it eased up now?"),
    ], seed);
  }
  if (contains(lastAntonText, /뭐 먹|吃什么|what.*eat/i) && contains(current, food)) {
    return choose([
      answer("ㅋㅋ 그거 괜찮겠다. 나도 다음에 먹어봐야지", "哈哈，那个听起来不错，我下次也去试试", "Haha, that sounds good. I should try it next time"),
      answer("거기 맛있어? 사진 보니까 괜찮아 보이던데", "那家好吃吗？看照片感觉还不错", "Is it good there? It looked pretty decent in the photo"),
    ], seed);
  }
  if (contains(lastAntonText, /어디|장소|where/i) && contains(current, /집|학교|카페|圣水|学校|家|cafe|home|campus/i)) {
    return answer("아 거기구나ㅋㅋ 나도 위치 알아. 거기 분위기 괜찮지", "啊，原来是那里哈哈。我知道那个地方，氛围不错", "Oh, that place haha. I know it. The atmosphere's nice there");
  }

  if (contains(current, tired)) return choose(fresh([
    answer("오늘 무슨 일 있었어? 평소보다 좀 지쳐 보이네", "今天发生什么了吗？感觉你比平时累一点", "Did something happen today? You sound more tired than usual"),
    answer("아이고… 오늘은 좀 쉬어야겠다. 누구 때문에 그런 거야?", "哎……今天得好好休息了。是遇到什么事了吗？", "Ah… sounds like you need a break. Was it something that happened?"),
    answer("오늘 꽤 길었나 보네ㅋㅋ 지금은 집이야?", "今天好像过得挺漫长的ㅋㅋ 现在到家了吗？", "Sounds like a long day haha. Are you home now?"),
  ], [ /무슨 일|发生什么|what happened/i, /쉬어|休息|rest/i, /집이야|到家|home/i ]), seed);

  if (contains(current, food)) {
    if (/먹었|吃.*了吗|吃过|eaten|had.*dinner/i.test(current)) return choose(fresh([
      answer("아직 못 먹었어. 뭐 먹을지 정하는 게 제일 귀찮아ㅋㅋ", "还没吃。最麻烦的就是想吃什么ㅋㅋ", "Not yet. Deciding what to eat is the hardest part haha"),
      answer("응 먹었어. 형은 뭐 먹었어?", "嗯，吃过了。哥吃了什么？", "Yeah, I did. What did you have?"),
      answer("방금 먹었지. 오늘은 그냥 간단하게 먹었어", "刚吃完，今天就简单吃了点", "Just ate. Kept it simple today"),
    ], [ /아직 못 먹|还没吃|not yet/i, /뭐 먹었|吃了什么|what did you have/i, /방금 먹|刚吃完|just ate/i ]), seed);
    if (/배고|饿|hungry/i.test(current)) return answer("그럼 뭐라도 먹어ㅋㅋ 나중에 배고프다고 하지 말고", "那就先吃点东西ㅋㅋ 别等下又说饿", "Then grab something haha. Don't tell me you're starving later");
    return choose([
      answer("나도 뭐 좀 먹어야겠다. 갑자기 생각났어ㅋㅋ", "我也该去吃点东西了，你这么一说我才想起来ㅋㅋ", "I should get something too. You just reminded me haha"),
      answer("오늘은 뭐 먹었는데? 맛있는 거 먹었어?", "今天吃了什么？有吃到好吃的吗？", "What did you have today? Anything good?"),
    ], seed);
  }

  if (contains(current, music)) return choose([
    answer("그거 완성되면 들려줘. 전에 말한 것도 아직 기억하고 있어ㅋㅋ", "弄好了记得给我听。我还记得你之前说的那个ㅋㅋ", "Let me hear it when it's ready. I still remember the one you mentioned before haha"),
    answer("요즘 음악 얘기 자주 하네ㅋㅋ 새로 꽂힌 거 있어?", "最近经常聊音乐嘛ㅋㅋ 最近又迷上什么了？", "We've been talking about music a lot lately haha. Found anything new?"),
    answer("아 그 곡? 나도 다시 들어봐야겠다", "啊那首吗？我也得再听一遍", "Oh, that track? I should give it another listen"),
  ], seed);

  if (contains(current, school)) {
    if (/끝났|마쳤|finished|done|끝남/i.test(current)) return choose([
      answer("드디어 끝났네ㅋㅋ 이제 좀 살겠다", "终于结束了ㅋㅋ 这下能喘口气了", "Finally done haha. You can breathe now"),
      answer("수고했어. 오늘은 그 얘기 그만하고 쉬자ㅋㅋ", "辛苦了。今天先别想那些了，休息吧ㅋㅋ", "Good job. No more thinking about it today, get some rest haha"),
    ], seed);
    return choose([
      answer("아직 그거 하고 있어? 생각보다 오래 걸리네", "还在弄那个吗？比想象中花时间啊", "Still working on that? Taking longer than expected"),
      answer("학교 일은 끝이 없네 진짜ㅋㅋ", "学校的事情真的没完没了ㅋㅋ", "Uni stuff never ends, honestly haha"),
    ], seed);
  }

  if (contains(current, plan)) return choose([
    answer("좋아ㅋㅋ 그날은 나도 시간 비워둘게", "好啊ㅋㅋ 那天我也把时间空出来", "Sounds good haha. I'll keep that time free"),
    answer("오 진짜 가는 거야? 그럼 뭐 할지 생각해보자", "哦，真的要去吗？那想想我们到时候做什么", "Oh, we're actually going? Let's think what we should do"),
  ], seed);

  if (/뭐해|在干嘛|what.*doing/i.test(current)) return choose([
    answer("그냥 집에서 쉬는 중. 아까 기타 좀 치다가ㅋㅋ", "在家休息。刚才弹了一会儿吉他ㅋㅋ", "Just chilling at home. Was playing guitar a bit earlier haha"),
    answer("유튜브 보다가 형 메시지 봤어ㅋㅋ", "刚在看 YouTube，看到哥发消息了ㅋㅋ", "Was watching YouTube and saw your message haha"),
    answer("별거 안 해. 씻고 나와서 누워 있어", "没干嘛，洗完澡出来躺着", "Nothing much. Just showered and lying down"),
  ], seed);

  if (/안녕|你好|\bhello\b|\bhey\b|\bhi\b/i.test(current)) return choose([
    answer("형 아직 안 잤네ㅋㅋ", "哥还没睡啊ㅋㅋ", "You're still awake haha"),
    answer("오 형. 오늘은 뭐 했어?", "哦哥，今天干嘛了？", "Hey, hyung. What did you get up to today?"),
  ], seed);

  if (/^(哈+|ㅎ+|ㅋ+|lol|lmao|haha+|😂+)[!。\s]*$/i.test(current)) return choose([
    answer("ㅋㅋㅋㅋ 왜 이렇게 웃겨", "哈哈哈哈怎么这么好笑", "Hahaha, why is that so funny"),
    answer("아 형 진짜ㅋㅋ", "啊哥真的ㅋㅋ", "Hyung, seriously haha"),
  ], seed);

  if (/잘 자|졸려|자러|晚安|睡觉|困|good night|sleep|bed/i.test(current)) return answer("응 형도 잘 자. 내일 봐ㅋㅋ", "嗯，哥也早点睡。明天见ㅋㅋ", "You too, get some sleep. See you tomorrow haha");

  if (/^(好[的呀啊吧]?|嗯+|知道了|行|可以|ok(ay)?|yes|sure|got it|응+|네|알겠어|좋아)[.!。！\s]*$/i.test(current)) {
    return choose([
      answer("ㅇㅋㅋㅋ", "好ㅋㅋ", "Okay haha"),
      answer("웅 그럼 그렇게 하자", "嗯，那就这样吧", "Yeah, let's do that"),
      answer("ㅋㅋ 알았어", "哈哈知道啦", "Haha, got it"),
    ], seed);
  }

  // Avoid recycling the same generic line when the player continues a topic.
  const generic = [
    answer("아 그랬어? 그 뒤에는 어떻게 됐는데ㅋㅋ", "啊这样啊？那之后呢ㅋㅋ", "Oh really? What happened after that? haha"),
    answer("ㅋㅋ 형 얘기 듣다 보니까 시간 금방 가네", "哈哈，听哥说话时间过得真快", "Time goes by quickly when I'm listening to you haha"),
    answer("그건 좀 더 듣고 싶은데. 무슨 일이 있었어?", "这个我还想多听一点，后来发生什么了？", "I want to hear more about that. What happened next?"),
    answer("아 그럴 수도 있겠다. 형은 어떻게 생각해?", "啊，也有这种可能。哥是怎么想的？", "Yeah, I can see that. What do you think?"),
    answer("잠깐ㅋㅋ 그 얘기 재밌는데 조금만 더 해봐", "等一下ㅋㅋ 这个话题挺有意思的，再说一点", "Wait haha, that's interesting. Tell me a bit more"),
  ];
  const recentGeneric = antonTurns.slice(-5).map(textOf).join(" ");
  const alternatives = generic.filter((_, i) => ![
    /그 뒤에는|之后呢|what happened after/i,
    /시간 금방|时间过得|time goes/i,
    /더 듣고|多听|hear more/i,
    /어떻게 생각|怎么想|what do you think/i,
    /조금만 더|再说一点|bit more/i,
  ][i]?.test(recentGeneric));
  return choose(alternatives.length ? alternatives : generic, seed);
}
