import { POSTS, type Post } from "./story";
import { FRIEND_POSTS } from "./social";
import type { Lang } from "./i18n";

const translations: Record<string, { zh: string; en: string }> = {
  p9: { zh: "最后一个秋季学期 🍂", en: "My last fall semester 🍂" },
  p8: { zh: "赢了 ⚽ 今天大家辛苦了", en: "We won ⚽ Good work today, everyone" },
  p7: { zh: "圣水散步", en: "A walk around Seongsu" },
  p6: { zh: "汉江拉面永远没错", en: "Ramyeon by the Han River never misses" },
  p5: { zh: "参观工作室 🎸", en: "Looking around the studio 🎸" },
  p4: { zh: "戒不掉午夜电影", en: "Can't give up late-night movies" },
  p3: { zh: "工学院 FC 圣诞聚餐 🎄", en: "Engineering FC Christmas dinner 🎄" },
  p2: { zh: "银杏季节", en: "Ginkgo season" },
  p1: { zh: "好久没踢完整场了", en: "First full match in a while" },
  "friend-anton-practice-20261026": { zh: "同样四小节已经练了一个小时。先休息一下", en: "An hour on the same four bars. Taking a break" },
  "friend-doyun-cafe-20261026": { zh: "小组作业文件名：最终_真的最终_v7。咖啡已经第二杯了", en: "Group project file: final_really-final_v7. On coffee number two" },
  "friend-minjae-football-20261025": { zh: "周日早上运动结束。今天防守还不错 ⚽", en: "Sunday morning workout done. Defense was pretty good today ⚽" },
  "friend-jiho-river-20261024": { zh: "风变冷了，长时间散步该结束了。不过天空还是很好看", en: "Too cold for long walks now. The sky was still lovely though" },
};

/** Display-only: explicit versions win; built-ins never replace edited originals. */
export function instagramCaption(post: Post, lang: Lang): string {
  const explicit = post.captionTranslations?.[lang];
  if (explicit !== undefined) return explicit;
  const seed = [...POSTS, ...FRIEND_POSTS].find((p) => p.id === post.id && p.caption === post.caption);
  return seed && lang !== "ko" ? translations[seed.id]?.[lang] ?? post.caption : post.caption;
}

export function editInstagramCaption(post: Post, lang: Lang, text: string): Post {
  return { ...post, captionTranslations: { ...post.captionTranslations, [lang]: text } };
}