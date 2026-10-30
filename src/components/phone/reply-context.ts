import type { Msg } from "./story";
import { sortMessages } from "./chronology";
type Text = { ko: string; zh: string; en: string };
const textOf = (m: Msg) => m.originalText ?? `${m.ko} ${m.zh} ${m.en ?? ""}`;
const answer = (ko: string, zh: string, en: string): Text => ({ ko, zh, en });
const contains = (text: string, expression: RegExp) => expression.test(text);

/** Transparent local fallback: ordered intents and actual prior statements, not AI understanding. */
export function replyFromContext(thread: Msg[], source: Msg): Text {
  const ordered = sortMessages(thread);
  const index = ordered.findIndex((m) => m.id === source.id);
  const recent = ordered.slice(0, index < 0 ? ordered.length : index).filter((m) => m.type === "text" || m.type === "image").slice(-24);
  const current = textOf(source).trim();
  const last = recent.filter((m) => m.sender === "them").at(-1);
  const previous = last ? textOf(last) : "";
  const food = /먹|밥|식사|吃|饭|饿|\beat\b|eaten|dinner|lunch|hungry|food/i;
  const music = /연습|베이스|첼로|음악|노래|练|贝斯|大提琴|音乐|歌|practice|practicing|bass|cello|music|song/i;
  const tired = /피곤|힘들|지쳤|累|疲惫|tired|exhausted|rough day/i;
  const plan = /만나|목요일|약속|정문|见面|周四|约好|正门|meet|Thursday|main gate/i;
  const acknowledgment = /^(好[的呀啊吧]?|嗯+|知道了|行|可以|ok(ay)?|yes|sure|got it|응+|네|알겠어|좋아)[.!。！\s]*$/i;

  if (source.type === "image") return answer("사진 받았어. 어떤 사진인지 얘기해 줄래?", "收到照片了，跟我说说拍的是什么？", "Got the photo. Can you tell me what it's of?");
  if (contains(current, tired)) return answer("오늘 많이 힘들었나 보다. 일단 좀 쉬어 형. 무슨 일 있었어?", "今天看来真的很累，哥先歇一会儿。发生什么事了吗？", "Sounds like today really wore you out. Rest a bit, hyung. Did something happen?");
  if (/^(哈+|ㅎ+|ㅋ+|lol|lmao|haha+|😂+)[!。\s]*$/i.test(current)) return contains(previous, /ㅋㅋ|lol|哈哈|웃|funny/i)
    ? answer("나도 생각할수록 웃겨ㅋㅋ", "我也是，越想越好笑哈哈", "Same, it gets funnier the more I think about it lol")
    : answer("ㅋㅋ 형 웃으니까 나도 웃게 되네", "哈哈，哥一笑我也跟着笑了", "Haha, now you've got me laughing too");
  if (acknowledgment.test(current)) {
    if (contains(previous, plan)) return answer("응, 방금 얘기한 대로 하자. 바뀌면 연락할게", "嗯，就按刚才说的来，有变化再联系你", "Yeah, let's stick to what we just agreed. I'll text if anything changes");
    if (contains(previous, /잘 자|sleep|bed|晚安|睡/i)) return answer("응 잘 자 형", "嗯，晚安哥", "Good night, hyung");
    if (contains(previous, /제목|title|歌名/i)) return answer("응, 보내주면 들어볼게", "嗯，发过来我就听", "Yeah, send it over and I'll give it a listen");
    if (contains(previous, food)) return answer("응. 나도 챙겨 먹을게", "嗯，我也会记得吃的", "Yeah. I'll make sure I eat too");
    if (contains(previous, tired)) return answer("응, 좀 쉬고 나서 얘기하자", "嗯，歇一会儿再聊吧", "Yeah, let's talk after you've had a breather");
    return answer("응 알겠어", "嗯，知道啦", "Okay, got it");
  }
  if (contains(current, food)) {
    const already = recent.filter((m) => m.sender === "them" && contains(textOf(m), /먹었|먹는 중|못 먹|안 먹|还没吃|吃过|正在吃|Not yet|haven't eaten|already ate|had dinner/i)).at(-1);
    if (/먹었|吃.*了吗|吃过|eaten|had.*dinner/i.test(current)) {
      if (already) {
        const before = textOf(already);
        if (/못 먹|안 먹|还没吃|Not yet|haven't/i.test(before)) return answer("아직이야. 아까 말한 것처럼 이제 먹으려고", "还没有，像刚才说的，正准备吃", "Not yet. Like I said, I'm about to get something");
        return answer("응 먹었어. 아까 얘기한 거 먹었지", "嗯，吃过了，就是刚才说的那个", "Yeah, I ate. The thing I mentioned earlier");
      }
      return answer("아직 못 먹었어. 이제 저녁 챙기려고", "还没吃，正准备弄点晚饭", "Not yet. About to get some dinner");
    }
    if (/뭐|什么|what/i.test(current) && /먹|吃|eat|food/i.test(current)) {
      const known = recent.filter((m) => m.sender === "them" && /라면|국밥|ramyeon|gukbap|泡面|汤饭/i.test(textOf(m))).at(-1);
      if (known) return answer("아까 얘기한 걸로 먹으려고. 아직 메뉴는 안 바꿨어", "就准备吃刚才说的那个，还没改主意", "Going with what I mentioned earlier. Haven't changed my mind");
      return answer("아직 못 정했어. 간단하게 먹을 생각이야", "还没决定，想简单吃一点", "Haven't decided yet. Probably something simple");
    }
    if (/먹었|吃了|吃过|\bate\b/i.test(current)) return answer("잘 챙겨 먹었네. 나도 이제 먹어야겠다", "有好好吃饭就好，我也该吃点了", "Good, glad you ate. I should get something too");
    if (/배고|饿|hungry/i.test(current)) return answer("그럼 뭐라도 먹어 형. 빈속으로 버티지 말고", "那哥先吃点东西，别空着肚子硬撑", "Get something to eat, hyung. Don't keep going on an empty stomach");
    return answer("응, 밥은 챙겨 먹자. 나도 아직 안 먹었어", "嗯，要记得吃饭，我也还没吃", "Yeah, let's make sure we eat. I haven't yet either");
  }
  if (contains(current, music)) {
    if (/뭐.*연습|练什么|what.*(practice|practicing)/i.test(current)) return answer("베이스 연습하고 있어. 오늘은 같은 부분 반복 중", "在练贝斯，今天一直重复练同一段", "Bass. Repeating the same part today");
    if (/노래.*뭐|무슨 노래|什么歌|what.*song/i.test(current)) return answer("제목은 아직 얘기 안 했네. 형이 말한 곡이면 제목 다시 보내줘", "好像还没说歌名，要是哥提过的那首，把歌名再发我一下", "We haven't named a song yet. If you mean the one you mentioned, send me the title again");
    if (/좋|好听|like|good/i.test(current)) return answer("그 부분 좋지. 나도 베이스 라인 자꾸 듣게 돼", "那一段确实好听，我也忍不住反复听贝斯线", "That part's good. I keep listening to the bass line too");
    return answer("응, 음악 얘기하고 있었지. 어떤 부분 말하는 거야?", "嗯，我们刚才在聊音乐，你说的是哪一段？", "Yeah, we were talking about music. Which part do you mean?");
  }
  if (/잘 자|졸려|자러|晚安|睡觉|困|good night|sleep|bed/i.test(current)) return answer("응 먼저 쉬어 형. 내일 얘기하자", "嗯，哥先休息，明天再聊", "Get some rest, hyung. Let's talk tomorrow");
  if (contains(current, plan)) {
    const agreed = recent.some((m) => m.sender === "them" && contains(textOf(m), plan));
    if (agreed) return answer("응, 아까 얘기한 약속 기억해. 변경되면 알려줘", "嗯，记得刚才说好的安排，有变化告诉我", "Yeah, I remember what we just agreed. Let me know if it changes");
    return answer("아직 시간은 안 정했지. 언제 생각하고 있어?", "时间还没定吧，你想着什么时候？", "We haven't settled a time yet. When were you thinking?");
  }
  if (/뭐해|在干嘛|what.*doing/i.test(current)) return answer("지금 잠깐 쉬는 중이야. 마침 형한테 연락 와서 좋네ㅋㅋ 형은 뭐 해?", "刚好在休息呢，正好收到哥的消息，还挺开心的哈哈。哥在干嘛？", "Just taking a little break. Nice timing, I was glad to see your message haha. What are you up to?");
  if (/안녕|你好|\bhello\b|\bhey\b|\bhi\b/i.test(current)) return answer("형 왔네ㅋㅋ 연락 기다린 건 아닌데, 오니까 좋다. 뭐 해?", "哥来啦哈哈。倒也不是在等消息，不过你来了还是挺开心的。你在干嘛？", "There you are haha. Nice to hear from you. What are you doing?");
  if (/[?？]|왜|어디|언제|뭐|为什么|哪里|什么时候|什么|\b(why|where|when|what|how)\b/i.test(current)) return answer("그건 내가 아직 잘 모르겠어. 어느 얘기인지 조금만 더 알려줘", "这个我还不太清楚，能再说具体一点吗？", "I'm not sure about that yet. Can you tell me a little more specifically?");
  return answer("응, 듣고 있어. 형 얘기 더 해 줘. 나 이런 얘기 듣는 거 좋아해", "嗯，我在听。哥再多说一点吧，我挺喜欢听你讲这些的", "I'm listening. Tell me more, hyung. I like hearing you talk about these things.");
}