import { NOTES, type Note } from "./story";
import type { Lang } from "./i18n";
export type NoteContent = { title: string; body: string };
export type LocalizedNote = Note & { folderId?: string | undefined; translations?: Partial<Record<Lang, NoteContent>> | undefined };
const translated: Record<string, { en: NoteContent; zh: NoteContent }> = {
 n1: { en: { title: "Movie list", body: "✓ About Time (March 2023, my place)\n✓ Interstellar, late showing (October 2023)\n✓ La La Land rewatch (2024.12.26)\n- Rewatch Dune: Part Two\n- Before Sunrise\n- Eternal Sunshine of the Spotless Mind\n- Perfect Days" }, zh: { title: "电影清单", body: "✓ 时空恋旅人（2023.03 我家）\n✓ 星际穿越午夜场（2023.10）\n✓ 重看爱乐之城（2024.12.26）\n- 再看沙丘2\n- 爱在黎明破晓前\n- 美丽心灵的永恒阳光\n- 完美的日子" } },
 n2: { en: { title: "Songs to listen to", body: "Daniel Caesar - Best Part (Anton's recommendation)\nThe 1975 - Somebody Else\nJannabi - For Lovers Who Hesitate\nFrank Ocean - Pink + White\nDAY6 - Time of Our Life" }, zh: { title: "想听的歌", body: "Daniel Caesar - Best Part（安东推荐）\nThe 1975 - Somebody Else\nJannabi - 为犹豫的恋人们\nFrank Ocean - Pink + White\nDAY6 - Time of Our Life" } },
 n3: { en: { title: "This week's to-do list", body: "□ Group project slides (Thursday)\n□ Monday 7 pm futsal — shoes!!\n□ Check graduation requirements\n□ Do laundry\n□ Daiso — towels, batteries\n□ Family home this weekend" }, zh: { title: "本周待办", body: "□ 小组作业PPT（周四）\n□ 周一7点踢室内足球——带鞋！！\n□ 确认毕业要求\n□ 洗衣服\n□ 大创——毛巾、电池\n□ 周末回家" } },
 n4: { en: { title: "Food I want", body: "- Pasta in Yeonnam-dong (with Jiho)\n- Ramen place near campus\n- Seongsu croissants again\n- Pork belly + soybean paste stew\n- New convenience-store desserts" }, zh: { title: "想吃的东西", body: "- 延南洞意面（和志浩）\n- 学校门口的拉面店\n- 再吃圣水的可颂\n- 五花肉 + 大酱汤\n- 便利店新品甜点" } },
 n5: { en: { title: "Old note", body: "Movies to watch together\n- About Time\n- Begin Again\n- Once\n\nKaraoke favorite\n- Sung Si Kyung — On the Street" }, zh: { title: "旧备忘录", body: "一起看的电影\n- 时空恋旅人\n- 再次出发\n- 曾经\n\nKTV拿手歌\n- 成始璄《在街上》" } },
 n6: { en: { title: "Anton's moving checklist", body: "□ March 22, 10 am\n□ Buy more packing tape\n□ Tie books with string\n□ He carries the cello himself (don't touch it)\n□ Check subway route: new home → campus\n□ Buy him tissues, detergent, a power strip" }, zh: { title: "安东搬家清单", body: "□ 3/22 上午10点\n□ 多买封箱胶带\n□ 用绳子捆书\n□ 大提琴他自己拿（不要碰）\n□ 确认新家 → 学校的地铁路线\n□ 给他买纸巾、洗涤剂、插线板" } },
};
export function noteContent(note: LocalizedNote, lang: Lang): NoteContent {
 const explicit = note.translations?.[lang];
 if (explicit) return explicit;
 const original = NOTES.find((n) => n.id === note.id);
 const matching = original && original.title === note.title && original.body === note.body;
 if (matching && lang !== "ko") return translated[note.id]?.[lang] ?? { title: note.title, body: note.body };
 return { title: note.title, body: note.body };
}
export function editNoteContent(note: LocalizedNote, lang: Lang, patch: Partial<NoteContent>): LocalizedNote {
 return { ...note, translations: { ...note.translations, [lang]: { ...noteContent(note, lang), ...patch } } };
}
