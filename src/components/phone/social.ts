import type { Post, Profile } from "./story";

export type SocialAccount = Profile & { id: string; followingIds: string[]; isPrivate?: boolean };
export type SocialPost = Post & { authorId: string };
export const SELF_ID = "sungchan";
export const ACCOUNTS_KEY = "ig-friend-accounts-v1";
export const FRIEND_POSTS_KEY = "ig-friend-posts-v1";
export const FRIEND_ACCOUNTS: SocialAccount[] = [
  { id: "anton", username: "a.ntonn", name: "찬영", bio: "첼로 / 베이스\n연습하고 집 가는 길", avatar: "img:practice", followers: "826", following: "219", followingIds: [SELF_ID, "jiho"] },
  { id: "minjae", username: "minjae_fc", name: "김민재", bio: "FC 공대 ⚽\n주말은 운동장에서", avatar: "img:football", followers: "1,204", following: "381", followingIds: [SELF_ID, "doyun"] },
  { id: "doyun", username: "doyun.p", name: "박도윤", bio: "마감 전 커피 한 잔\nSeoul", avatar: "img:cafe", followers: "573", following: "302", followingIds: [SELF_ID, "minjae"] },
  { id: "jiho", username: "jiho_l", name: "이지호", bio: "산책하면서 찍은 것들", avatar: "img:hanriver", followers: "649", following: "257", followingIds: [SELF_ID, "anton"] },
  { id: "yuna", username: "yuna_Yuna", name: "김유나", bio: "", avatar: "https://images.unsplash.com/photo-1652564521843-0b4da636de85?auto=format&fit=crop&w=512&h=512&q=85", followers: "1,083", following: "486", followingIds: [SELF_ID], isPrivate: true },
];
export const FRIEND_POSTS: SocialPost[] = [
  { id: "friend-anton-practice-20261026", authorId: "anton", image: "img:practice", caption: "같은 네 마디만 한 시간째. 잠깐 쉬자", date: "2026-10-26", time: "18:40", likes: 83, comments: [{ id: "fc-a1", user: "jiho_l", text: "손목도 쉬어야 돼", date: "2026-10-26", time: "18:52" }] },
  { id: "friend-doyun-cafe-20261026", authorId: "doyun", image: "img:cafe", caption: "팀플 파일명 최종_진짜최종_v7. 커피는 두 잔째", date: "2026-10-26", time: "16:10", likes: 46, comments: [{ id: "fc-d1", user: "minjae_fc", text: "v8에서 보자", date: "2026-10-26", time: "16:28" }] },
  { id: "friend-minjae-football-20261025", authorId: "minjae", image: "img:football", caption: "일요일 오전 운동 끝. 오늘 수비 괜찮았다 ⚽", date: "2026-10-25", time: "11:35", likes: 112, comments: [{ id: "fc-m1", user: "doyun.p", text: "난 아직 자고 있었음", date: "2026-10-25", time: "12:02" }] },
  { id: "friend-jiho-river-20261024", authorId: "jiho", image: "img:hanriver", caption: "바람 차가워져서 이제 긴 산책은 끝. 그래도 하늘은 좋았다", date: "2026-10-24", time: "17:20", likes: 67, comments: [{ id: "fc-j1", user: "a.ntonn", text: "색 좋다", date: "2026-10-24", time: "18:11" }] },
];

/** Read-only merge: old posts with no author stay the owner's records, never reseeded or rewritten. */
export function socialFeed(own: Post[], friends: SocialPost[]): SocialPost[] {
  return [...own.map((p) => ({ ...p, authorId: SELF_ID })), ...friends].sort((a, b) => `${b.date} ${b.time ?? "00:00"}`.localeCompare(`${a.date} ${a.time ?? "00:00"}`));
}
export const authorPosts = (posts: SocialPost[], authorId: string) => posts.filter((p) => p.authorId === authorId);

/** DM identity is the same live record used for feed authors, never a KKT profile. */
export const dmAccount = (accounts: SocialAccount[], contactId: string) => accounts.find((account) => account.id === contactId);