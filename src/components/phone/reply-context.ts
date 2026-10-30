import type { Msg } from "./story";
import { sortMessages } from "./chronology";

type Text = { ko: string; zh: string; en: string };
const answer = (ko: string, zh: string, en: string): Text => ({ ko, zh, en });
const contains = (text: string, expression: RegExp) => expression.test(text);

// Stable variation: the same message keeps its reply, but different messages
// don't all sound as if they came from one template.
function choose<T>(items: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return items[hash % items.length];
}
const textOf = (m: Msg) => m.originalText ?? `${m.ko} ${m.zh} ${m.en ?? ""}`;

export function replyFromContext(thread: Msg[], source: Msg): Text {
  const ordered = sortMessages(thread);
  const index = ordered.findIndex((m) => m.id === source.id);
  const recent = ordered
    .slice(0, index < 0 ? ordered.length : index)
    .filter((m) => m.type === "text" || m.type === "image")
    .slice(-16);
  const current = textOf(source).trim();
  const previous = recent.filter((m) => m.sender === "them").at(-1);
  const previousText = previous ? textOf(previous) : "";
  const seed = source.id || current;
  const food = /먹|밥|식사|吃|饭|饿|\beat\b|eaten|dinner|lunch|hungry|food/i;
  const music = /연습|베이스|첼로|음악|노래|练|贝斯|大提琴|音乐|歌|practice|practicing|bass|cello|music|song/i;
  const tired = /피곤|힘들|지쳤|累|疲惫|tired|exhausted|rough day/i;
  const plan = /만나|목요일|약속|정문|见面|周四|约好|正门|meet|Thursday|main gate/i;
  const acknowledgment = /^(好[的呀啊吧]?|嗯+|知道了|行|可以|ok(ay)?|yes|sure|got it|응+|네|알겠어|좋아)[.!。！\s]*$/i;

  if (source.type === "image") return choose([
    answer("오 사진ㅋㅋ 이거 어디야?", "哦照片哈哈，这是哪里？", "Oh, a photo haha. Where's this?"),
    answer("이거 분위기 좋다. 직접 찍은 거야?", "这张氛围不错，是你拍的吗？", "This has a nice vibe. Did you take it?"),
    answer("ㅋㅋ 갑자기 사진 보내네. 뭐 보여주고 싶었어?", "哈哈突然发照片，是想给我看什么？", "A photo out of nowhere haha. What did you want to show me?"),
  ], seed);

  if (contains(current, tired)) return choose([
    answer("오늘 좀 빡셌나 보네. 무슨 일 있었어?", "今天好像挺不容易的，发生什么了？", "Sounds like it's been a rough day. What happened?"),
    answer("에고 고생했네. 지금은 좀 괜찮아?", "哎，辛苦了。现在好一点了吗？", "Ah, that's a lot. Feeling a bit better now?"),
    answer("그럴 땐 아무것도 하지 말고 좀 쉬어ㅋㅋ", "这种时候就先什么都别管，休息一下吧哈哈", "Then don't worry about anything for a bit. Just rest haha"),
  ], seed);

  if (/^(哈+|ㅎ+|ㅋ+|lol|lmao|haha+|😂+)[!。\s]*$/i.test(current)) {
    if (contains(previousText, /ㅋㅋ|lol|哈哈|웃|funny/i)) {
      return answer("ㅋㅋㅋㅋ 그러니까", "哈哈哈哈就是啊", "Lmao exactly");
    }
    return choose([
      answer("왜 웃어ㅋㅋ 나도 궁금하잖아", "笑什么啦哈哈，我也好奇了", "What's so funny haha now I'm curious"),
      answer("ㅋㅋㅋ 아 진짜", "哈哈哈，真的服了", "Hahaha, seriously"),
      answer("형 웃는 거 여기까지 들리는 것 같아ㅋㅋ", "感觉隔着屏幕都听到哥在笑了哈哈", "I can practically hear you laughing through the screen haha"),
    ], seed);
  }

  if (acknowledgment.test(current)) {
    if (contains(previousText, plan)) return answer("ㅇㅋ 그때 봐ㅋㅋ", "好，那到时候见哈哈", "Okay, see you then haha");
    if (contains(previousText, /잘 자|sleep|bed|晚安|睡/i)) return answer("응 형도 잘 자", "嗯，哥也晚安", "You too, get some sleep");
    if (contains(previousText, food)) return answer("ㅋㅋ 그래 꼭 챙겨 먹어", "哈哈好，记得吃饭", "Haha, okay. Make sure you eat");
    if (contains(previousText, tired)) return answer("응 푹 쉬어", "嗯，好好休息", "Yeah, get some proper rest");
    return choose([
      answer("ㅇㅋㅋㅋ", "好哈哈", "Okay haha"),
      answer("웅 알겠어", "嗯嗯知道啦", "Yeah, got it"),
      answer("그래그래", "好啦好啦", "Alright, alright"),
    ], seed);
  }

  if (contains(current, food)) {
    if (/먹었|吃.*了吗|吃过|eaten|had.*dinner/i.test(current)) {
      return choose([
        answer("아직ㅋㅋ 뭐 먹을지 고민 중이야", "还没哈哈，正在想吃什么", "Not yet haha. Still figuring out what to eat"),
        answer("응 먹었어. 형은? 뭐 먹었는데?", "嗯，吃过了。哥呢，吃了什么？", "Yeah, I did. What about you? What did you have?"),
        answer("방금 먹고 왔어ㅋㅋ 형은 이제 먹어?", "刚吃完回来哈哈。哥现在才去吃吗？", "Just ate haha. Are you going to eat now?"),
      ], seed);
    }
    if (/배고|饿|hungry/i.test(current)) return choose([
      answer("뭐라도 먹어ㅋㅋ 나중에 더 배고파져", "先随便吃点吧哈哈，不然等下更饿", "Get something in you haha. You'll only get hungrier later"),
      answer("나도 갑자기 배고파졌어", "你这么一说我也突然饿了", "Now you've made me hungry too"),
    ], seed);
    if (/뭐.*연|什么.*吃|what.*eat/i.test(current)) return answer("아직 못 정했어. 형 추천해 봐ㅋㅋ", "还没想好，哥推荐一个哈哈", "Haven't decided. Give me a recommendation haha");
    return choose([
      answer("아 맞다 밥 먹어야 되는데ㅋㅋ", "啊对，我也该吃饭了哈哈", "Oh right, I should eat too haha"),
      answer("형은 먹었어? 난 아직 고민 중", "哥吃了吗？我还在纠结吃什么", "Have you eaten? I'm still deciding"),
    ], seed);
  }

  if (contains(current, music)) {
    if (/뭐.*연습|练什么|what.*(practice|practicing)/i.test(current)) return choose([
      answer("베이스 만지고 있었어. 아직 제대로 된 건 아니고ㅋㅋ", "刚在弄贝斯，还没练出什么成果哈哈", "Was messing around on the bass. Nothing decent yet haha"),
      answer("오늘은 베이스. 같은 부분만 계속 치는 중이야", "今天练贝斯，一直在重复同一段", "Bass today. Been going over the same bit again and again"),
    ], seed);
    if (/노래.*뭐|무슨 노래|什么歌|what.*song/i.test(current)) return answer("아직 딱 정한 건 없어. 몇 개 들어보는 중ㅋㅋ", "还没决定具体哪首，正在听几首比较一下哈哈", "Haven't settled on one yet. Listening to a few haha");
    return choose([
      answer("그치ㅋㅋ 요즘 이런 분위기 좋더라", "对吧哈哈，最近挺喜欢这种感觉的", "Right? I've been into this kind of sound lately"),
      answer("나중에 같이 들을래? 이어폰 한 쪽 줄게ㅋㅋ", "下次一起听？分你一只耳机哈哈", "Want to listen together sometime? I'll share an earbud haha"),
      answer("그 부분 계속 맴돌아. 자꾸 생각나", "那一段一直在脑子里转，停不下来", "That part's been stuck in my head"),
    ], seed);
  }

  if (/잘 자|졸려|자러|晚安|睡觉|困|good night|sleep|bed/i.test(current)) {
    return choose([
      answer("벌써 자게?ㅋㅋ 잘 자 형", "这么快就睡啦？哈哈，晚安哥", "Heading to bed already? haha. Night, hyung"),
      answer("응 오늘은 일찍 자자. 잘 자", "嗯，今天早点睡吧。晚安", "Yeah, let's get an early night. Sleep well"),
    ], seed);
  }

  if (contains(current, plan)) {
    const agreed = recent.some((m) => m.sender === "them" && contains(textOf(m), plan));
    if (agreed) return choose([
      answer("응 기억하고 있어ㅋㅋ 그날 보자", "嗯，记着呢哈哈。那天见", "Yeah, I remember haha. See you then"),
      answer("좋아. 시간 가까워지면 다시 얘기하자", "好啊，快到时间了再确认一下", "Sounds good. We'll check in closer to the day"),
    ], seed);
    return choose([
      answer("나 시간 괜찮아. 형은 언제가 편해?", "我有空，哥什么时候方便？", "I'm free. When works for you?"),
      answer("오 어디 가려고?ㅋㅋ", "哦，打算去哪儿？哈哈", "Oh, where are we thinking of going? haha"),
    ], seed);
  }

  if (/뭐해|在干嘛|what.*doing/i.test(current)) return choose([
    answer("그냥 누워 있어ㅋㅋ 형은?", "在躺着哈哈，哥呢？", "Just lying around haha. You?"),
    answer("과제 조금 하다가 쉬는 중. 형 뭐 해?", "刚写了会儿作业，现在休息。哥在干嘛？", "Was doing a bit of coursework, taking a break now. What about you?"),
    answer("유튜브 보고 있었어. 별거 안 해ㅋㅋ", "刚在看 YouTube，没干嘛哈哈", "Was watching YouTube. Nothing much haha"),
    answer("방금 씻고 나왔어", "刚洗完澡出来", "Just got out of the shower"),
  ], seed);

  if (/안녕|你好|\bhello\b|\bhey\b|\bhi\b/i.test(current)) return choose([
    answer("형 안 자고 뭐 해ㅋㅋ", "哥还没睡啊，在干嘛哈哈", "You're still up? What are you doing haha"),
    answer("오 형ㅋㅋ 무슨 일이야", "哦，哥哈哈，怎么啦", "Oh, hyung haha. What's up?"),
    answer("왔어? 나 방금 폰 보고 있었어", "来啦？我刚好在看手机", "Hey, you're here. I was just on my phone"),
  ], seed);

  if (/[?？]|왜|어디|언제|뭐|为什么|哪里|什么时候|什么|\b(why|where|when|what|how)\b/i.test(current)) {
    return choose([
      answer("음 잠깐만ㅋㅋ 무슨 뜻인지 알 것 같기도 하고", "嗯等一下哈哈，我好像懂你的意思了", "Wait a sec haha. I think I get what you mean"),
      answer("아 그 얘기구나ㅋㅋ", "啊，原来你说的是那个哈哈", "Ohh, that's what you mean haha"),
      answer("그건 좀 더 얘기해 봐. 궁금한데", "这个再说说，我有点好奇", "Tell me a bit more about that. I'm curious"),
    ], seed);
  }

  return choose([
    answer("아 진짜?ㅋㅋ 그건 좀 의외다", "啊真的？哈哈，这倒有点意外", "Oh really? haha. Didn't expect that"),
    answer("ㅋㅋ 그래서 어떻게 됐어?", "哈哈，然后呢？后来怎么样了？", "Haha, what happened after that?"),
    answer("아 뭔지 알 것 같아", "啊，我好像懂你的意思", "Ah, I think I know what you mean"),
    answer("그 얘기 처음 듣는데ㅋㅋ", "这事我还是第一次听说哈哈", "That's the first I've heard of that haha"),
    answer("음 그건 좀 궁금하다", "嗯，这个我倒有点好奇", "Hmm, now I'm curious about that"),
  ], seed);
}
