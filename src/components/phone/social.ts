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
  { id: "yuna", username: "yuna_Yuna", name: "김유나", bio: "", avatar: "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23f3e8dc%22/%3E%3Cpath d=%22M35 78 48 20 88 48 Q100 44 112 48 L152 20 165 78 Q180 98 174 130 Q165 180 100 182 Q35 180 26 130 Q20 98 35 78Z%22 fill=%22%23d6a77b%22/%3E%3Cpath d=%22M48 69 57 36 83 55 M152 69 143 36 117 55%22 fill=%22%23f4c9a6%22/%3E%3Cellipse cx=%2272%22 cy=%22105%22 rx=%227%22 ry=%2210%22 fill=%22%233b3029%22/%3E%3Cellipse cx=%22128%22 cy=%22105%22 rx=%227%22 ry=%2210%22 fill=%22%233b3029%22/%3E%3Cpath d=%22M94 123 Q100 132 106 123 Q100 117 94 123%22 fill=%22%23a85e62%22/%3E%3Cpath d=%22M100 130 Q91 143 82 132 M100 130 Q109 143 118 132%22 fill=%22none%22 stroke=%22%233b3029%22 stroke-width=%223%22 stroke-linecap=%22round%22/%3E%3C/svg%3E", followers: "1,083", following: "486", followingIds: [SELF_ID], isPrivate: true },
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