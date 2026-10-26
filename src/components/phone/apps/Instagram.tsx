import { useState } from "react";
import { type AppProps, tr } from "../i18n";
import { POSTS, PROFILE, type Post, type Profile } from "../story";
import { uid, usePersist } from "../store";
import { BackBtn, EditBar, Field, ImageField, TopBar, resolveImg } from "../ui";

export default function Instagram({ lang, onHome }: AppProps) {
  const [posts, setPosts] = usePersist<Post[]>("ig-posts-v1", POSTS);
  const [prof, setProf] = usePersist<Profile>("ig-profile-v1", PROFILE);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Post | null>(null);
  const [profDraft, setProfDraft] = useState<Profile | null>(null);
  const S = tr(lang, { en: "Save", ko: "저장", zh: "保存" });
  const C = tr(lang, { en: "Cancel", ko: "취소", zh: "取消" });
  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));
  const post = posts.find((p) => p.id === openId);

  if (draft) {
    const set = (p: Partial<Post>) => setDraft({ ...draft, ...p });
    return (
      <div className="app-page bg-background">
        <TopBar title={tr(lang, { en: "Edit post", ko: "게시물 수정", zh: "编辑帖子" })} />
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <ImageField label={tr(lang, { en: "Replace image", ko: "사진 변경", zh: "替换图片" })} value={draft.image} onChange={(v) => set({ image: v })} />
          <Field label={tr(lang, { en: "Caption", ko: "문구", zh: "配文" })}><textarea className="sheet-input" rows={3} value={draft.caption} onChange={(e) => set({ caption: e.target.value })} /></Field>
          <div className="flex gap-2">
            <Field label={tr(lang, { en: "Date", ko: "날짜", zh: "发布时间" })}><input type="date" className="sheet-input" value={draft.date} onChange={(e) => set({ date: e.target.value })} /></Field>
            <Field label={tr(lang, { en: "Likes", ko: "좋아요", zh: "点赞数" })}><input type="number" className="sheet-input" value={draft.likes} onChange={(e) => set({ likes: +e.target.value })} /></Field>
          </div>
          <div className="text-xs text-muted-foreground">{tr(lang, { en: "Comments", ko: "댓글", zh: "评论" })}</div>
          {draft.comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <input className="sheet-input w-28" value={c.user} onChange={(e) => set({ comments: draft.comments.map((x) => (x.id === c.id ? { ...x, user: e.target.value } : x)) })} />
              <input className="sheet-input flex-1" value={c.text} onChange={(e) => set({ comments: draft.comments.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)) })} />
              <button className="text-destructive" onClick={() => set({ comments: draft.comments.filter((x) => x.id !== c.id) })}>🗑</button>
            </div>
          ))}
          <button className="edit-chip" onClick={() => set({ comments: [...draft.comments, { id: uid(), user: "user", text: "" }] })}>＋ {tr(lang, { en: "Comment", ko: "댓글", zh: "评论" })}</button>
          <button className="w-full py-2.5 rounded-xl bg-muted text-destructive" onClick={() => { setPosts(posts.filter((p) => p.id !== draft.id)); setDraft(null); setOpenId(null); }}>
            {tr(lang, { en: "Delete post", ko: "게시물 삭제", zh: "删除帖子" })}
          </button>
        </div>
        <EditBar save={S} cancel={C} onCancel={() => setDraft(null)} onSave={() => {
          setPosts(posts.some((p) => p.id === draft.id) ? posts.map((p) => (p.id === draft.id ? draft : p)) : [draft, ...posts]);
          setOpenId(draft.id); setDraft(null);
        }} />
      </div>
    );
  }

  if (profDraft) {
    const set = (p: Partial<Profile>) => setProfDraft({ ...profDraft, ...p });
    return (
      <div className="app-page bg-background">
        <TopBar title={tr(lang, { en: "Edit profile", ko: "프로필 편집", zh: "编辑主页" })} />
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <ImageField label={tr(lang, { en: "Avatar", ko: "프로필 사진", zh: "头像" })} value={profDraft.avatar} onChange={(v) => set({ avatar: v })} />
          {(["username", "name", "followers", "following"] as const).map((k) => (
            <Field key={k} label={k}><input className="sheet-input" value={profDraft[k]} onChange={(e) => set({ [k]: e.target.value })} /></Field>
          ))}
          <Field label="bio"><textarea className="sheet-input" rows={3} value={profDraft.bio} onChange={(e) => set({ bio: e.target.value })} /></Field>
        </div>
        <EditBar save={S} cancel={C} onCancel={() => setProfDraft(null)} onSave={() => { setProf(profDraft); setProfDraft(null); }} />
      </div>
    );
  }

  if (post)
    return (
      <div className="app-page bg-background">
        <TopBar left={<BackBtn onClick={() => setOpenId(null)} />} title={tr(lang, { en: "Posts", ko: "게시물", zh: "帖子" })}
          right={<button className="text-sm" onClick={() => setDraft({ ...post, comments: post.comments.map((c) => ({ ...c })) })}>{tr(lang, { en: "Edit", ko: "편집", zh: "编辑" })}</button>} />
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 px-3 py-2">
            <img src={resolveImg(prof.avatar)} alt="" className="w-8 h-8 rounded-full object-cover ig-ring" />
            <b className="text-sm">{prof.username}</b>
          </div>
          <img src={resolveImg(post.image)} alt="" className="w-full aspect-square object-cover" />
          <div className="px-3 py-2 space-y-1.5 text-sm">
            <div className="text-xl flex gap-4">♡ <span>💬</span> <span>➤</span></div>
            <b>{post.likes.toLocaleString()} {tr(lang, { en: "likes", ko: "좋아요", zh: "次赞" })}</b>
            <p><b>{prof.username}</b> {post.caption}</p>
            {post.comments.map((c) => <p key={c.id}><b>{c.user}</b> {c.text}</p>)}
            <p className="text-xs text-muted-foreground">{post.date.replaceAll("-", ".")}</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="app-page bg-background">
      <TopBar left={<BackBtn onClick={onHome} />} title={prof.username}
        right={<button className="text-xl" onClick={() => setDraft({ id: uid(), image: "", caption: "", date: "2026-10-26", likes: 0, comments: [] })}>⊕</button>} />
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center gap-5 px-4 pt-3">
          <img src={resolveImg(prof.avatar)} alt="" className="w-20 h-20 rounded-full object-cover ig-ring" />
          <div className="flex flex-1 justify-around text-center text-sm">
            <div><b className="block text-base">{posts.length}</b>{tr(lang, { en: "posts", ko: "게시물", zh: "帖子" })}</div>
            <div><b className="block text-base">{prof.followers}</b>{tr(lang, { en: "followers", ko: "팔로워", zh: "粉丝" })}</div>
            <div><b className="block text-base">{prof.following}</b>{tr(lang, { en: "following", ko: "팔로잉", zh: "关注" })}</div>
          </div>
        </div>
        <div className="px-4 py-2 text-sm whitespace-pre-line"><b>{prof.name}</b>{"\n"}{prof.bio}</div>
        <div className="px-4 pb-3"><button className="w-full py-1.5 rounded-lg bg-muted text-sm font-semibold" onClick={() => setProfDraft({ ...prof })}>{tr(lang, { en: "Edit profile", ko: "프로필 편집", zh: "编辑主页" })}</button></div>
        <div className="grid grid-cols-3 gap-0.5">
          {sorted.map((p) => (
            <button key={p.id} onClick={() => setOpenId(p.id)} className="aspect-square bg-muted">
              {p.image && <img src={resolveImg(p.image)} alt="" className="w-full h-full object-cover" loading="lazy" />}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-center text-muted-foreground py-3">Fictional fan work · 虚构创作</p>
      </div>
    </div>
  );
}
