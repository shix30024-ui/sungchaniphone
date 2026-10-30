// All story content is fictional fan fiction. It lives here as data; UI only renders it.
import football from "@/assets/story/football.jpg";
import hanriver from "@/assets/story/hanriver.jpg";
import cinema from "@/assets/story/cinema.jpg";
import bbq from "@/assets/story/bbq.jpg";
import practice from "@/assets/story/practice.jpg";
import cafe from "@/assets/story/cafe.jpg";
import moving from "@/assets/story/moving.jpg";
import campus from "@/assets/story/campus.jpg";

export const IMG: Record<string, string> = { football, hanriver, cinema, bbq, practice, cafe, moving, campus };

/* ---------- KakaoTalk ---------- */
export type MsgType = "text" | "image" | "system" | "date";
export type Msg = {
  id: string; contactId: string; sender: "me" | "them"; type: MsgType;
  ko: string; zh: string; en?: string; date: string; time: string; image?: string | undefined; order: number;
  live?: boolean; read?: boolean; notified?: boolean; createdAt?: string;
  originalText?: string; replyTo?: string; replyKind?: "preset" | "ai";
  requiresReply?: boolean;
};
export type Contact = { id: string; name: string; avatar: string; status: string; unread: number };

export const CONTACTS: Contact[] = [
  { id: "anton", name: "찬영 Anton", avatar: "", status: "🎻", unread: 2 },
  { id: "minjae", name: "김민재", avatar: "", status: "⚽ FC 공대", unread: 0 },
  { id: "doyun", name: "박도윤", avatar: "", status: "과제 지옥", unread: 1 },
  { id: "jiho", name: "이지호", avatar: "", status: "", unread: 0 },
  { id: "mom", name: "엄마", avatar: "", status: "", unread: 0 },
  { id: "dad", name: "아빠", avatar: "", status: "", unread: 0 },
];

type Row = [s: "me" | "them", ko: string, zh: string, time: string, type?: MsgType, image?: string];
let n = 0;
const day = (contactId: string, date: string, rows: Row[]): Msg[] =>
  rows.map(([sender, ko, zh, time, type = "text", image]) => ({
    id: `m${++n}`, contactId, sender, type, ko, zh, date, time, image, order: n,
  }));

export const MESSAGES: Msg[] = [
  // 2022 — fan filter, a little stiff
  ...day("anton", "2022-11-14", [
    ["them", "", "", "22:39", "system"],
    ["them", "드디어 형 카톡 추가했다ㅋㅋ", "终于加到哥的 KKT 了啊 lol。", "22:40"],
    ["me", "ㅋㅋㅋ 드디어? 우리 오늘 처음 얘기한 거 아님?", "哈哈哈终于？我们不是今天才第一次说话吗？", "22:41"],
    ["them", "아 그게ㅋㅋ 그냥 말이 그렇다는 거예요", "啊那个哈哈 就是随口一说啦", "22:43"],
    ["them", "오늘 동아리 환영회 재밌었어요 형", "今天社团欢迎会很好玩，哥", "22:43"],
    ["me", "너 노래 잘하더라", "你唱歌挺好的啊", "22:45"],
    ["them", "헐 들으셨어요..? 감사합니다", "天 你听到了吗..? 谢谢", "22:46"],
    ["me", "말 편하게 해 존댓말 어색해", "说话随便点吧，敬语好别扭", "22:47"],
    ["them", "아 넵.. 아니 응ㅋㅋ 노력해볼게 형", "啊好的..不对，嗯哈哈 我会努力的哥", "22:49"],
  ]),
  ...day("anton", "2022-12-03", [
    ["me", "찬영아 시험 끝났어?", "灿荣啊，考完了吗？", "15:02"],
    ["them", "응 방금 끝났어 형은?", "嗯刚考完，哥呢？", "15:10"],
    ["me", "나도. 학교 앞 국밥 먹으러 갈래?", "我也是。去学校门口吃汤饭吗？", "15:11"],
    ["them", "좋아요! 아 좋아ㅋㅋ", "好的！啊，好哈哈", "15:11"],
    ["them", "정문으로 갈게", "我去正门那边", "15:12"],
  ]),
  // 2023 — getting close
  ...day("anton", "2023-03-18", [
    ["me", "앤톤 오늘 뭐 해", "Anton 今天干嘛", "18:20"],
    ["them", "과제.. 근데 곧 끝나", "作业..不过快写完了", "18:34"],
    ["me", "끝나면 우리 집 와 영화 보자", "写完来我家看电影吧", "18:35"],
    ["them", "무슨 영화?", "什么电影？", "18:35"],
    ["me", "너가 골라", "你来选", "18:36"],
    ["them", "그럼 어바웃 타임. 아직 안 봤어", "那就《时空恋旅人》。我还没看过", "18:38"],
    ["me", "그걸 아직 안 봤다고? 빨리 와", "你居然还没看过？快来", "18:38"],
    ["them", "편의점 들렀다 갈게 뭐 사갈까", "我顺路去便利店，要买什么", "18:52"],
    ["me", "콜라랑 아무 과자", "可乐和随便什么零食", "18:53"],
  ]),
  ...day("anton", "2023-05-20", [
    ["me", "축구 끝나고 사우나 갈 건데 같이 갈래?", "踢完球去汗蒸，要一起吗？", "16:05"],
    ["them", "아.. 나 그런 데 학교 형들이랑 가본 적 없는데", "啊..我没跟学校的哥哥们去过那种地方", "16:20"],
    ["me", "그냥 씻고 식혜 마시는 거야ㅋㅋ", "就是洗个澡喝甜米露而已哈哈", "16:21"],
    ["them", "ok.. 형이랑이면 갈게", "ok..跟哥的话就去", "16:24"],
  ]),
  ...day("anton", "2023-05-21", [
    ["them", "어제 생각보다 좋았어ㅋㅋ 식혜 진짜 맛있더라", "昨天比想象的好哈哈 甜米露真好喝", "11:02"],
    ["me", "거봐 다음에 또 가자", "看吧，下次再去", "11:15"],
    ["them", "응", "嗯", "11:15"],
  ]),
  ...day("anton", "2023-08-12", [
    ["me", "한강 갈까?", "去汉江吗？", "19:10"],
    ["them", "지금? 콜", "现在？走", "19:12"],
    ["me", "뚝섬역 3번 출구", "纛岛站 3 号出口", "19:13"],
    ["me", "", "", "20:31", "image", "img:hanriver"],
    ["them", "한강 라면은 국룰이지", "汉江就得吃泡面", "20:32"],
  ]),
  ...day("anton", "2023-10-28", [
    ["me", "표 끊었다 11시 반", "票买好了，十一点半", "17:40"],
    ["them", "또 심야야?ㅋㅋ", "又是深夜场？哈哈", "17:52"],
    ["me", "그래야 사람 없지", "这样人才少啊", "17:52"],
    ["them", "나 내일 1교시인데.. 그래도 갈게", "我明天第一节有课..不过还是去", "17:55"],
    ["me", "", "", "23:21", "image", "img:cinema"],
  ]),
  // 2024 late — Anton has his own boundaries
  ...day("anton", "2024-11-09", [
    ["me", "앤톤 어디야", "Anton 你在哪", "17:30"],
    ["them", "연습실", "练习室", "17:41"],
    ["me", "끝나고 밥?", "结束了吃饭？", "17:41"],
    ["them", "응 근데 오늘은 안지 마ㅋㅋ", "嗯 不过今天别抱我哈哈", "17:43"],
    ["me", "왜ㅋㅋ", "为什么哈哈", "17:43"],
    ["them", "그냥 이제 그런 거 좀 그래", "就是现在有点不习惯那样了", "17:44"],
    ["me", "알았어 알았어 밥은 먹자", "知道了知道了，饭还是要吃", "17:45"],
    ["them", "7시에 정문", "七点正门", "17:45"],
  ]),
  ...day("anton", "2024-12-02", [
    ["them", "", "", "21:12", "image", "img:practice"],
    ["them", "새 베이스 라인 짜는 중", "在写新的贝斯 line", "21:12"],
    ["me", "오 들려줘", "哦 给我听听", "21:20"],
    ["them", "나중에 직접 들려줄게. not ready yet", "下次当面弹给你听。还没准备好", "21:22"],
    ["me", "기대된다", "期待", "21:22"],
  ]),
  ...day("anton", "2024-12-24", [
    ["me", "크리스마스에 뭐 해", "圣诞节干嘛", "12:00"],
    ["them", "친구들이랑 홍대", "跟朋友去弘大", "12:30"],
    ["me", "나는 축구팀 애들이랑 고기", "我跟球队的人吃烤肉", "12:31"],
    ["them", "ㅋㅋ 각자 잘 놀자", "哈哈 各自玩好", "12:31"],
    ["them", "아 근데 26일에 영화 볼래?", "啊对了，26 号要看电影吗？", "12:33"],
    ["me", "콜 심야로?", "好啊 深夜场？", "12:33"],
    ["them", "…ㅇㅋ", "…ok", "12:40"],
  ]),
  // 2025 — Anton moves
  ...day("anton", "2025-02-15", [
    ["me", "오늘 집에 있어?", "今天在家吗？", "20:05"],
    ["them", "응 왜", "嗯，怎么了？", "20:07"],
    ["me", "그냥 갈까 해서", "没什么，想着要不要过去。", "20:07"],
    ["them", "ㅋㅋㅋ 또?", "ㅋㅋㅋ 又来？", "20:08"],
    ["me", "왜 싫어?", "怎么，不愿意？", "20:08"],
    ["them", "아니 오라고ㅋㅋ", "不是，让你来啊ㅋㅋ", "20:09"],
    ["me", "편의점 들러서 갈게 5분", "我顺路去便利店，五分钟", "20:09"],
  ]),
  ...day("anton", "2025-03-01", [
    ["them", "형 나 이사 날짜 정해졌어", "哥，我搬家日期定了", "14:22"],
    ["me", "언제?", "什么时候？", "14:25"],
    ["them", "3월 22일", "3 月 22 日", "14:25"],
    ["them", "학교에서 좀 더 먼 쪽이야", "离学校远一点的地方", "14:26"],
    ["me", "이제 편의점 가자고 바로 못 부르겠네", "以后不能随叫随到去便利店了", "14:27"],
    ["them", "ㅋㅋ 그러게", "哈哈 是啊", "14:30"],
    ["me", "짐 옮기는 거 도와줄게", "我帮你搬东西", "14:30"],
    ["them", "고마워 형", "谢谢哥", "14:31"],
  ]),
  ...day("anton", "2025-03-22", [
    ["them", "", "", "13:40", "image", "img:moving"],
    ["them", "박스가 끝이 없어", "箱子怎么都搬不完", "13:40"],
    ["me", "첼로는 내가 들게", "大提琴我来搬", "13:42"],
    ["them", "그건 내가 들 거야ㅋㅋ 비싸", "那个我自己来哈哈 很贵的", "13:42"],
    ["me", "ㅇㅋ 책은 내가", "ok 书我来", "13:43"],
  ]),
  ...day("anton", "2025-04-10", [
    ["me", "이제 너네 집 가려면 좀 멀다", "现在去你家有点远了。", "21:15"],
    ["them", "그러게ㅋㅋ 예전엔 진짜 가까웠는데", "是啊ㅋㅋ 以前真的很近。", "21:20"],
    ["me", "그래도 갈 거임", "不过我还是会去。", "21:20"],
    ["them", "알았어ㅋㅋ 오기 전에 연락해", "知道了ㅋㅋ 来之前跟我说一声。", "21:21"],
  ]),
  ...day("anton", "2025-09-06", [
    ["me", "토요일 시간 돼?", "周六有空吗？", "10:02"],
    ["them", "오후는 돼", "下午可以", "10:30"],
    ["me", "성수 카페 가자", "去圣水的咖啡店吧", "10:31"],
    ["them", "우리 집에서 지하철 40분이네ㅋㅋ 그래도 ㄱㄱ", "从我家坐地铁要 40 分钟哈哈 不过走吧", "10:33"],
    ["me", "", "", "15:10", "image", "img:cafe"],
    ["them", "여기 크루아상 맛있다", "这家可颂好吃", "15:11"],
  ]),
  // 2026 — now
  ...day("anton", "2026-09-27", [
    ["me", "축구 이겼다", "球赛赢了", "18:40"],
    ["them", "오 ㅊㅋ 골 넣었어?", "哦恭喜 进球了吗？", "18:55"],
    ["me", "당연하지", "当然", "18:55"],
    ["them", "ㅋㅋ 인스타 봤어", "哈哈 看到你 ins 了", "18:56"],
  ]),
  ...day("anton", "2026-10-24", [
    ["them", "형 이 노래 들어봐", "哥你听听这首", "23:02"],
    ["them", "Daniel Caesar - Best Part", "Daniel Caesar - Best Part", "23:02"],
    ["me", "좋은데? 요즘 이런 거 들어?", "挺好啊？最近在听这种？", "23:30"],
    ["them", "응 첼로로 편곡해보고 싶어", "嗯 想用大提琴改编一下", "23:31"],
    ["me", "완성되면 제일 먼저 들려줘", "做好了第一个给我听", "23:32"],
    ["them", "생각해볼게ㅋㅋ", "考虑一下哈哈", "23:35"],
  ]),
  ...day("anton", "2026-10-26", [
    ["me", "수업 끝났어?", "下课了吗？", "12:41"],
    ["them", "30분 남음", "还有 30 分钟", "12:50"],
    ["me", "밥 먹었어?", "吃饭了吗？", "12:50"],
    ["them", "아직", "还没", "12:51"],
    ["me", "학식 말고 라멘 먹자", "别吃食堂了，去吃拉面", "12:51"],
    ["them", "형 이쪽까지 오게?", "哥你要特地过来这边？", "12:52"],
    ["me", "어차피 오후 수업 없음", "反正下午没课", "12:52"],
    ["them", "ㅋㅋ ok 정문에서 봐", "哈哈 ok 正门见", "12:53"],
  ]),
  // friends & family
  ...day("minjae", "2026-10-25", [
    ["them", "내일 7시 풋살 ㄱ?", "明天七点踢五人制？", "21:10"],
    ["me", "ㅇㅋ 신발 챙겨갈게", "ok 我带鞋", "21:12"],
    ["them", "지난번처럼 늦으면 음료수 쏘기", "像上次那样迟到就请喝饮料", "21:13"],
    ["me", "그건 사고였음", "那是意外", "21:13"],
  ]),
  ...day("doyun", "2026-10-23", [
    ["them", "조별과제 피피티 언제까지 돼?", "小组作业 PPT 什么时候能好？", "16:00"],
    ["me", "목요일까지 할게", "周四前做完", "16:20"],
    ["them", "ㄱㅅ 발표는 내가 함", "谢了 我来讲", "16:21"],
  ]),
  ...day("doyun", "2026-10-26", [
    ["them", "교수님이 발표 순서 바꿨대", "教授说换了发表顺序", "11:30"],
  ]),
  ...day("jiho", "2026-10-18", [
    ["them", "형 연남동 파스타집 아직 안 가봤죠", "哥你还没去过延南洞那家意面吧", "13:00"],
    ["me", "ㅇㅇ 다음 주에 가자", "嗯 下周去吧", "13:40"],
  ]),
  ...day("mom", "2026-10-26", [
    ["them", "밥은 잘 챙겨 먹고 다니니", "饭有好好吃吗", "09:12"],
    ["me", "응 엄마 오늘 친구랑 라멘 먹어", "嗯妈，今天跟朋友吃拉面", "12:55"],
    ["them", "그래 추우니까 따뜻하게 입고", "好 天冷穿暖和点", "13:01"],
  ]),
  ...day("dad", "2026-10-12", [
    ["them", "주말에 집에 오니", "周末回家吗", "19:00"],
    ["me", "다음 주에 갈게요", "下周回去", "19:30"],
    ["them", "그래", "好", "19:31"],
  ]),
];
// system rows need text
const firstMessage = MESSAGES[0];
if (firstMessage) {
  firstMessage.ko = "찬영님을 친구로 추가했습니다.";
  firstMessage.zh = "已添加灿荣为好友。";
}

/* ---------- Instagram ---------- */
export type Comment = { id: string; user: string; text: string; date?: string; time?: string; source?: "player" };
export type Post = { id: string; image: string; images?: string[]; caption: string; captionTranslations?: Partial<Record<"en" | "ko" | "zh", string>>; date: string; time?: string; likes: number; comments: Comment[]; liked?: boolean; saved?: boolean };
export type Profile = { username: string; name: string; bio: string; avatar: string; followers: string; following: string };

export const PROFILE: Profile = {
  username: "zcc.daily", name: "성찬", bio: "⚽ 🎤 Seoul\n4학년 마지막 학기", avatar: "img:football", followers: "48.2K", following: "312",
};
const c = (user: string, text: string): Comment => ({ id: Math.random().toString(36).slice(2), user, text });
export const POSTS: Post[] = [
  { id: "p9", image: "img:campus", caption: "마지막 가을 학기 🍂", date: "2026-10-20", likes: 5120, comments: [c("doyun.p", "벌써 졸업이라니"), c("jiho_l", "형 사진 왜 이렇게 잘 찍어요")] },
  { id: "p8", image: "img:football", caption: "이겼다 ⚽ 오늘 다들 고생했어", date: "2026-09-27", likes: 6890, comments: [c("minjae_fc", "골 넣고 세레머니 뭐임ㅋㅋ"), c("a.ntonn", "ㅊㅋ")] },
  { id: "p7", image: "img:cafe", caption: "성수 산책", date: "2025-09-06", likes: 4310, comments: [c("hyeri.k", "여기 어디예요?")] },
  { id: "p6", image: "img:hanriver", caption: "한강 라면은 진리", date: "2025-07-19", likes: 3980, comments: [c("minjae_fc", "나 왜 안 불렀냐")] },
  { id: "p5", image: "img:practice", caption: "작업실 구경 🎸", date: "2025-06-14", likes: 3720, comments: [c("jiho_l", "악기 많다"), c("a.ntonn", "만지지 마ㅋㅋ")] },
  { id: "p4", image: "img:cinema", caption: "심야 영화는 못 끊어", date: "2024-12-26", likes: 4102, comments: [c("doyun.p", "또 심야냐")] },
  { id: "p3", image: "img:bbq", caption: "FC 공대 크리스마스 회식 🎄", date: "2024-12-24", likes: 3550, comments: [c("minjae_fc", "내년에도 우승 가자")] },
  { id: "p2", image: "img:campus", caption: "은행나무 시즌", date: "2024-10-30", likes: 2980, comments: [] },
  { id: "p1", image: "img:football", caption: "오랜만에 풀경기", date: "2024-04-13", likes: 2650, comments: [c("minjae_fc", "다리 괜찮냐")] },
];

/* ---------- X ---------- */
export type Reply = { id: string; user: string; text: string; date: string; time: string; translations?: Partial<Record<"en" | "ko" | "zh", string>> };
export type Tweet = { id: string; text: string; date: string; time: string; likes: number; rts: number; replies?: Reply[]; translations?: Partial<Record<"en" | "ko" | "zh", string>> };
export const TWEETS: Tweet[] = [
  { id: "t10", text: "오늘 본래 그냥 밥만 먹으려고 했음", date: "2026-10-26", time: "14:30", likes: 812, rts: 40 },
  { id: "t9", text: "이 노래 요즘 계속 듣는 중", date: "2026-10-25", time: "00:12", likes: 1203, rts: 88 },
  { id: "t8", text: "내일 수업 있는 사람이 아직도 안 자는 중", date: "2026-10-22", time: "02:41", likes: 2310, rts: 120 },
  { id: "t7", text: "풋살 이김. 근데 무릎이 내 편이 아님", date: "2026-09-27", time: "21:04", likes: 1840, rts: 61 },
  { id: "t6", text: "4학년 되니까 시간이 두 배속", date: "2026-03-03", time: "23:15", likes: 990, rts: 32 },
  { id: "t5", text: "지하철 40분이면 가깝다고 우기는 중", date: "2025-09-06", time: "22:00", likes: 1450, rts: 47 },
  { id: "t4", text: "이삿짐 나르면 운동 따로 안 해도 됨", date: "2025-03-22", time: "19:20", likes: 1302, rts: 50 },
  { id: "t3", text: "왜 영화는 맨날 이렇게 늦은 시간으로 고르게 되는지ㅋㅋ", date: "2024-12-26", time: "01:58", likes: 2777, rts: 140 },
  { id: "t2", text: "연습실에서 노래 부르다 목 나감", date: "2024-05-11", time: "22:30", likes: 1022, rts: 30 },
  { id: "t1", text: "사우나 끝나고 식혜가 제일 맛있음", date: "2023-05-20", time: "20:10", likes: 870, rts: 21 },
];

/* ---------- Photos ---------- */
export type Photo = { id: string; image: string; date: string; note: string };
export type Album = { id: string; name: string; photos: Photo[] };
const ph = (image: string, date: string, note: string): Photo => ({ id: Math.random().toString(36).slice(2), image: `img:${image}`, date, note });
export const ALBUMS: Album[] = [
  { id: "a2023", name: "2023", photos: [ph("hanriver", "2023-08-12", "뚝섬 한강"), ph("cinema", "2023-10-28", "11시 반 심야")] },
  { id: "a2024", name: "2024", photos: [ph("football", "2024-04-13", "풀경기"), ph("campus", "2024-10-30", "은행나무"), ph("practice", "2024-12-02", "앤톤 연습실"), ph("bbq", "2024-12-24", "FC 회식"), ph("cinema", "2024-12-26", "또 심야")] },
  { id: "a2025", name: "2025", photos: [ph("moving", "2025-03-22", "이삿날"), ph("practice", "2025-06-14", "작업실"), ph("hanriver", "2025-07-19", "한강 라면"), ph("cafe", "2025-09-06", "성수")] },
  { id: "a2026", name: "2026", photos: [ph("football", "2026-09-27", "이긴 날"), ph("campus", "2026-10-20", "마지막 가을")] },
];

/* ---------- Notes ---------- */
export type Note = { id: string; title: string; body: string; date: string; updatedAt?: string };
export const NOTES: Note[] = [
  { id: "n1", title: "영화 리스트", date: "2026-10-24", body: "✓ 어바웃 타임 (2023.03 우리집)\n✓ 인터스텔라 심야 (2023.10)\n✓ 라라랜드 재관람 (2024.12.26)\n- 듄 파트2 다시 보기\n- 비포 선라이즈\n- 이터널 선샤인\n- 퍼펙트 데이즈" },
  { id: "n2", title: "듣고 싶은 노래", date: "2026-10-25", body: "Daniel Caesar - Best Part (앤톤 추천)\nThe 1975 - Somebody Else\n잔나비 - 주저하는 연인들을 위해\nfrank ocean - Pink + White\nDay6 - 한 페이지가 될 수 있게" },
  { id: "n3", title: "이번 주 할 일", date: "2026-10-26", body: "□ 조별과제 피피티 (목)\n□ 월 7시 풋살 - 신발!!\n□ 졸업 요건 확인\n□ 세탁기 돌리기\n□ 다이소 - 수건, 건전지\n□ 주말 본가" },
  { id: "n4", title: "먹고 싶은 거", date: "2026-10-18", body: "- 연남동 파스타 (지호랑)\n- 학교 앞 라멘집\n- 성수 크루아상 또\n- 삼겹살 + 된장찌개\n- 편의점 신상 디저트" },
  { id: "n5", title: "옛날 메모", date: "2023-03-18", body: "같이 볼 영화\n- 어바웃 타임\n- 비긴 어게인\n- 원스\n\n노래방 18번\n- 성시경 거리에서" },
  { id: "n6", title: "앤톤 이사 체크", date: "2025-03-15", body: "□ 3/22 오전 10시\n□ 박스 테이프 더 사기\n□ 책 끈으로 묶기\n□ 첼로는 본인이 듦 (건드리지 말 것)\n□ 새 집 → 학교 지하철 노선 확인\n□ 휴지, 세제, 멀티탭 사주기" },
];
