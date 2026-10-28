import { TWEETS } from "./story";
import type { Lang } from "./i18n";
export type XText = { text: string; translations?: Partial<Record<Lang, string>> };
const seedTranslations: Record<string, { en: string; zh: string }> = {
  t10: { en: "I was originally just going to get something to eat today.", zh: "今天本来只是想吃个饭。" },
  t9: { en: "Been listening to this song a lot lately.", zh: "最近一直在听这首歌。" },
  t8: { en: "Still awake even though I have class tomorrow.", zh: "明天有课的人，到现在还没睡。" },
  t7: { en: "Won at futsal. My knee isn't on my side though.", zh: "室内足球赢了，但膝盖不站在我这边。" },
  t6: { en: "Time runs at double speed in senior year.", zh: "到了大四，时间像开了两倍速。" },
  t5: { en: "Insisting that 40 minutes on the subway counts as close.", zh: "嘴硬说坐地铁四十分钟也算近。" },
  t4: { en: "Moving boxes is enough of a workout on its own.", zh: "搬行李就不用另外运动了。" },
  t3: { en: "Why do I always end up picking such late movie showings lol.", zh: "为什么看电影总是选这么晚的场次哈哈。" },
  t2: { en: "Lost my voice singing in the practice room.", zh: "在练习室唱歌把嗓子唱哑了。" },
  t1: { en: "Sikhye tastes best after a sauna.", zh: "蒸完桑拿喝甜米露最好喝。" },
};
export function xText(record: XText & { id?: string }, lang: Lang): string {
  const explicit = record.translations?.[lang];
  if (explicit !== undefined) return explicit;
  const original = TWEETS.find((tweet) => tweet.id === record.id && tweet.text === record.text);
  if (original && lang !== "ko") return seedTranslations[original.id]?.[lang] ?? record.text;
  return record.text;
}
export function editXText<T extends XText>(record: T, lang: Lang, text: string): T {
  return { ...record, translations: { ...record.translations, [lang]: text } };
}
export const weatherAppName = (name: string, lang: Lang) => name === "Weather" ? { en: "Weather", ko: "날씨", zh: "天气" }[lang] : name;