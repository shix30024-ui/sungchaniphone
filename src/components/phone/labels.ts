import { type Lang, tr } from "./i18n";

const labels = {
  back: { en: "Back", ko: "뒤로", zh: "返回" },
  save: { en: "Save", ko: "저장", zh: "保存" },
  cancel: { en: "Cancel", ko: "취소", zh: "取消" },
  edit: { en: "Edit", ko: "편집", zh: "编辑" },
  delete: { en: "Delete", ko: "삭제", zh: "删除" },
  confirmDelete: { en: "Delete this item?", ko: "이 항목을 삭제할까요?", zh: "确认删除此项？" },
  title: { en: "Title", ko: "제목", zh: "标题" },
  date: { en: "Date", ko: "날짜", zh: "日期" },
  time: { en: "Time", ko: "시간", zh: "时间" },
  note: { en: "Notes", ko: "메모", zh: "备注" },
  search: { en: "Search", ko: "검색", zh: "搜索" },
  empty: { en: "No items", ko: "항목 없음", zh: "暂无内容" },
  add: { en: "Add", ko: "추가", zh: "添加" },
  photo: { en: "Photo", ko: "사진", zh: "照片" },
  album: { en: "Album", ko: "앨범", zh: "相簿" },
  rename: { en: "Rename", ko: "이름 변경", zh: "重命名" },
  move: { en: "Move to album", ko: "앨범으로 이동", zh: "移动至相簿" },
  modified: { en: "Last modified", ko: "최근 수정", zh: "最近修改" },
  fictional: { en: "Fictional fan work", ko: "가상 팬 창작", zh: "虚构同人创作" },
  caption: { en: "PL / Caption", ko: "PL / 문구", zh: "PL／帖子配文" },
  username: { en: "Username", ko: "사용자 이름", zh: "用户名" },
  name: { en: "Name", ko: "이름", zh: "昵称" },
  followers: { en: "Followers", ko: "팔로워", zh: "粉丝数" },
  following: { en: "Following", ko: "팔로잉", zh: "关注数" },
  bio: { en: "Bio", ko: "소개", zh: "简介" },
  replies: { en: "Replies", ko: "답글", zh: "回复" },
  reply: { en: "Reply", ko: "답글", zh: "回复" },
  calendar: { en: "Calendar", ko: "캘린더", zh: "日历" },
  event: { en: "Event", ko: "일정", zh: "日程" },
  music: { en: "Music", ko: "음악", zh: "音乐" },
  songs: { en: "Songs", ko: "노래", zh: "歌曲" },
  playlists: { en: "Playlists", ko: "플레이리스트", zh: "播放列表" },
  favorites: { en: "Favorites", ko: "즐겨찾기", zh: "收藏" },
  artist: { en: "Artist", ko: "아티스트", zh: "歌手" },
  playlistName: { en: "Playlist name", ko: "플레이리스트 이름", zh: "播放列表名称" },
  songTitle: { en: "Song title", ko: "곡 제목", zh: "歌曲名称" },
} as const;
export type Label = keyof typeof labels;
export const label = (lang: Lang, key: Label) => {
  // A stale app module can still request an older key during a live update.
  // Never send an absent entry to tr and blank the whole phone screen.
  const entry = Object.prototype.hasOwnProperty.call(labels, key) ? labels[key] : undefined;
  return entry ? tr(lang, entry) : String(key ?? "");
};
export const confirmDelete = (lang: Lang) => window.confirm(label(lang, "confirmDelete"));
export const localeFor = (lang: Lang) => ({ en: "en-US", ko: "ko-KR", zh: "zh-CN" })[lang];