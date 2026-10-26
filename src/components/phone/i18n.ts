export type Lang = "en" | "ko" | "zh";

export const LANGS: { id: Lang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "ko", label: "한국어" },
  { id: "zh", label: "中文" },
];

const dict = {
  enter: { en: "Enter Passcode", ko: "암호 입력", zh: "输入密码" },
  wrong: { en: "Wrong passcode", ko: "암호가 틀렸습니다", zh: "密码错误" },
  del: { en: "Delete", ko: "삭제", zh: "删除" },
  cancel: { en: "Cancel", ko: "취소", zh: "取消" },
  swipe: { en: "Tap to unlock", ko: "탭하여 잠금 해제", zh: "轻点解锁" },
  edit: { en: "Edit", ko: "편집", zh: "编辑" },
  done: { en: "Done", ko: "완료", zh: "完成" },
  editApp: { en: "Edit App", ko: "앱 편집", zh: "编辑应用" },
  newApp: { en: "New App", ko: "새 앱", zh: "新应用" },
  name: { en: "Name", ko: "이름", zh: "名称" },
  icon: { en: "Icon text / emoji", ko: "아이콘 문자 / 이모지", zh: "图标文字 / 表情" },
  color: { en: "Color", ko: "색상", zh: "颜色" },
  link: { en: "Link (optional)", ko: "링크 (선택)", zh: "链接（可选）" },
  save: { en: "Save", ko: "저장", zh: "保存" },
  remove: { en: "Remove App", ko: "앱 제거", zh: "移除应用" },
  add: { en: "Add App", ko: "앱 추가", zh: "添加应用" },
  inDock: { en: "Put in Dock", ko: "Dock에 배치", zh: "放入 Dock" },
  language: { en: "Language", ko: "언어", zh: "语言" },
  lock: { en: "Lock Phone", ko: "잠금", zh: "锁定手机" },
  settings: { en: "Settings", ko: "설정", zh: "设置" },
  noLink: { en: "No content yet", ko: "아직 내용이 없습니다", zh: "暂无内容" },
  back: { en: "Home", ko: "홈", zh: "主屏幕" },
  reset: { en: "Reset Apps", ko: "앱 초기화", zh: "重置应用" },
} as const;

export type Key = keyof typeof dict;
export const t = (lang: Lang, k: Key) => dict[k][lang];

const locale: Record<Lang, string> = { en: "en-US", ko: "ko-KR", zh: "zh-CN" };
export const fmtTime = (d: Date) =>
  `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
export const fmtDate = (lang: Lang, d: Date) =>
  d.toLocaleDateString(locale[lang], { weekday: "long", month: "long", day: "numeric" });
