import { useState } from "react";
import { type AppProps, tr } from "../i18n";
import { POSTS, PROFILE, type Post, type Profile } from "../story";
import { uid, usePersist } from "../store";
import { label, confirmDelete } from "../labels";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Plus, Trash2, Home, Search, User, Heart, MessageCircle, Send, Bookmark, ArrowLeft, MoreHorizontal, Clapperboard, ChevronLeft } from "lucide-react";
import { postImages, moveImage } from "../media";
import { sendChat } from "../conversation";
import { Stories, InstagramDM } from "./InstagramSocial";
import { SELF_ID, FRIEND_ACCOUNTS, FRIEND_POSTS, ACCOUNTS_KEY, FRIEND_POSTS_KEY, socialFeed, authorPosts, type SocialPost, type SocialAccount } from "../social";
import { STORY_DATE } from "../chronology";
import { BackBtn, EditBar, Field, ImageField, TopBar, resolveImg } from "../ui";

export default function Instagram({ lang, onHome }: AppProps) {
  const [tab, setTab] = useState<"home" | "search" | "profile">("home");
  const [dm, setDm] = useState(false);
  const [query, setQuery] = useState("");
  const [comment, setComment] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState<{ id: string; text: string } | null>(null);
  const [posts, setPosts] = usePersist<Post[]>("ig-posts-v1", POSTS);
  const [friendPosts, setFriendPosts] = usePersist<SocialPost[]>(FRIEND_POSTS_KEY, FRIEND_POSTS);
  const [accounts, setAccounts] = usePersist<SocialAccount[]>(ACCOUNTS_KEY, FRIEND_ACCOUNTS);
  const [profileId, setProfileId] = useState(SELF_ID);
  const [prof, setProf] = usePersist<Profile>("ig-profile-v1", PROFILE);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Post | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [profDraft, setProfDraft] = useState<Profile | null>(null);
  const S = tr(lang, { en: "Save", ko: "저장", zh: "保存" });
  const C = tr(lang, { en: "Cancel", ko: "취소", zh: "取消" });
  const sorted = socialFeed(posts, friendPosts);
  const account = (id: string): Profile => id === SELF_ID ? prof : accounts.find((a) => a.id === id) ?? prof;
  const selectedProfile = account(profileId);
  const profilePosts = authorPosts(sorted, profileId);
  const post = sorted.find((p) => p.id === openId);
  const postAuthor = post ? account(post.authorId) : prof;
  const showProfile = (id: string) => { setProfileId(id); setOpenId(null); setCommentsOpen(false); setTab("profile"); };

  const newPost = () => setDraft({ id: uid(), image: "", caption: "", date: STORY_DATE, likes: 0, comments: [], ...(profileId !== SELF_ID && tab === "profile" ? { authorId: profileId } : {}) });
  const updatePost = (id: string, update: (p: Post) => Post) => {
    if (posts.some((p) => p.id === id)) setPosts((current) => current.map((p) => p.id === id ? update(p) : p));
    else setFriendPosts((current) => current.map((p) => p.id === id ? { ...update(p), authorId: p.authorId } : p));
  };
  const like = (p: Post) => updatePost(p.id, (current) => ({ ...current, liked: !current.liked, likes: Math.max(0, current.likes + (current.liked ? -1 : 1)) }));
  const nav = <nav className="ig-bottom-nav">
    {([{ id: "home", icon: Home, title: tr(lang, { en: "Home", ko: "홈", zh: "首页" }) }, { id: "search", icon: Search, title: label(lang, "search") }] as const).map(({ id, icon: Icon, title }) => <Button key={id} variant="ghost" size="icon" aria-label={title} aria-pressed={tab === id} onClick={() => setTab(id)}><Icon strokeWidth={tab === id ? 2.6 : 1.8} /></Button>)}
    <Button variant="ghost" size="icon" aria-label={tr(lang, { en: "New post", ko: "새 게시물", zh: "新增帖子" })} onClick={newPost}><Plus strokeWidth={1.8} className="ig-plus-box" /></Button>
    <Button variant="ghost" size="icon" aria-label="Reels" onClick={() => setTab("search")}><Clapperboard strokeWidth={1.8} /></Button>
    <Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Profile", ko: "프로필", zh: "个人主页" })} aria-pressed={tab === "profile"} onClick={() => showProfile(SELF_ID)}><img src={resolveImg(prof.avatar)} alt="" className={`ig-nav-avatar ${tab === "profile" ? "ig-nav-avatar-on" : ""}`} /></Button>
  </nav>;
  const interactions = (p: Post) => <div className="flex items-center gap-1 py-1">
    <Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Like", ko: "좋아요", zh: "点赞" })} aria-pressed={!!p.liked} className={p.liked ? "text-destructive" : ""} onClick={() => like(p)}><Heart fill={p.liked ? "currentColor" : "none"} /></Button>
    <Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Comments", ko: "댓글", zh: "评论" })} onClick={() => { setOpenId(p.id); setImageIndex(0); setCommentsOpen(true); }}><MessageCircle /></Button>
    <Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Share", ko: "공유", zh: "分享" })} onClick={() => setShareId(p.id)}><Send /></Button>
    <Button variant="ghost" size="icon" className="ml-auto" aria-label={tr(lang, { en: "Save post", ko: "게시물 저장", zh: "收藏帖子" })} aria-pressed={!!p.saved} onClick={() => updatePost(p.id, (current) => ({ ...current, saved: !current.saved }))}><Bookmark fill={p.saved ? "currentColor" : "none"} /></Button>
  </div>;
  const share = shareId && <div className="ig-share-sheet" role="dialog"><div className="sheet"><div className="flex justify-between items-center"><b>{tr(lang, { en: "Share", ko: "공유", zh: "分享" })}</b><Button variant="ghost" size="icon" aria-label={C} onClick={() => setShareId(null)}><ArrowLeft /></Button></div>{["anton", "minjae", "doyun"].map((id) => <Button key={id} variant="ghost" className="w-full justify-start" onClick={() => { const shared = sorted.find((p) => p.id === shareId); if (shared) { sendChat("ig", id, `${account(shared.authorId).username} · ${shared.caption}`, lang); setShareId(null); setDm(true); } }}>{id === "anton" ? "Anton" : id === "minjae" ? "김민재" : "박도윤"}</Button>)}</div></div>;
  if (dm) return <InstagramDM accounts={accounts} lang={lang} onClose={() => setDm(false)} />;

  if (draft) {
    const set = (p: Partial<Post>) => setDraft({ ...draft, ...p });
    return (
      <div className="app-page bg-background">
        <TopBar title={tr(lang, { en: "Edit post", ko: "게시물 수정", zh: "编辑帖子" })} />
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {postImages(draft).map((image, i) => <div key={i} className="flex items-center gap-1 flex-wrap">
            <ImageField label={label(lang, "photo")} value={image} onChange={(v) => { const images = [...postImages(draft)]; images[i] = v; set({ images, image: images[0] ?? "" }); }} />
            <Button variant="ghost" size="icon" aria-label="↑" disabled={i === 0} onClick={() => { const images = moveImage(postImages(draft), i, -1); set({ images, image: images[0] ?? "" }); }}><ArrowUp /></Button>
            <Button variant="ghost" size="icon" aria-label="↓" disabled={i === postImages(draft).length - 1} onClick={() => { const images = moveImage(postImages(draft), i, 1); set({ images, image: images[0] ?? "" }); }}><ArrowDown /></Button>
            <Button variant="ghost" size="icon" aria-label={label(lang, "delete")} onClick={() => { if (!confirmDelete(lang)) return; const images = postImages(draft).filter((_, index) => index !== i); set({ images, image: images[0] ?? "" }); }}><Trash2 /></Button>
          </div>)}
          <Button variant="secondary" onClick={() => set({ images: [...postImages(draft), ""] })}><Plus />{label(lang, "photo")}</Button>
          <Field label={label(lang, "caption")}><textarea className="sheet-input" rows={3} value={draft.caption} onChange={(e) => set({ caption: e.target.value })} /></Field>
          <div className="flex gap-2">
            <Field label={tr(lang, { en: "Date", ko: "날짜", zh: "发布时间" })}><input type="date" className="sheet-input" value={draft.date} onChange={(e) => set({ date: e.target.value })} /></Field>
            <Field label={label(lang, "time")}><input type="time" className="sheet-input" value={draft.time ?? ""} onChange={(e) => set({ time: e.target.value })} /></Field>
            <Field label={tr(lang, { en: "Likes", ko: "좋아요", zh: "点赞数" })}><input type="number" className="sheet-input" value={draft.likes} onChange={(e) => set({ likes: +e.target.value })} /></Field>
          </div>
          <div className="text-xs text-muted-foreground">{tr(lang, { en: "Comments", ko: "댓글", zh: "评论" })}</div>
          {draft.comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <input className="sheet-input w-28" value={c.user} onChange={(e) => set({ comments: draft.comments.map((x) => (x.id === c.id ? { ...x, user: e.target.value } : x)) })} />
              <input className="sheet-input flex-1" value={c.text} onChange={(e) => set({ comments: draft.comments.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)) })} />
              <button className="text-destructive" onClick={() => { if (confirmDelete(lang)) set({ comments: draft.comments.filter((x) => x.id !== c.id) }); }}>🗑</button>
            </div>
          ))}
          <button className="edit-chip" onClick={() => set({ comments: [...draft.comments, { id: uid(), user: "user", text: "" }] })}>＋ {tr(lang, { en: "Comment", ko: "댓글", zh: "评论" })}</button>
          <button className="w-full py-2.5 rounded-xl bg-muted text-destructive" onClick={() => { if (!confirmDelete(lang)) return; if ("authorId" in draft && draft.authorId !== SELF_ID) setFriendPosts((current) => current.filter((p) => p.id !== draft.id)); else setPosts((current) => current.filter((p) => p.id !== draft.id)); setDraft(null); setOpenId(null); }}>
            {tr(lang, { en: "Delete post", ko: "게시물 삭제", zh: "删除帖子" })}
          </button>
        </div>
        <EditBar save={S} cancel={C} onCancel={() => setDraft(null)} onSave={() => {
          if ("authorId" in draft && typeof draft.authorId === "string" && draft.authorId !== SELF_ID) {
            const saved = { ...draft, authorId: draft.authorId };
            setFriendPosts((current) => current.some((p) => p.id === draft.id) ? current.map((p) => p.id === draft.id ? saved : p) : [saved, ...current]);
          } else setPosts((current) => current.some((p) => p.id === draft.id) ? current.map((p) => p.id === draft.id ? draft : p) : [draft, ...current]);
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
            <Field key={k} label={label(lang, k)}><input className="sheet-input" value={profDraft[k]} onChange={(e) => set({ [k]: e.target.value })} /></Field>
          ))}
          <Field label={label(lang, "bio")}><textarea className="sheet-input" rows={3} value={profDraft.bio} onChange={(e) => set({ bio: e.target.value })} /></Field>
        </div>
        <EditBar save={S} cancel={C} onCancel={() => setProfDraft(null)} onSave={() => { if (profileId === SELF_ID) setProf(profDraft); else setAccounts((current) => current.map((a) => a.id === profileId ? { ...a, ...profDraft } : a)); setProfDraft(null); }} />
      </div>
    );
  }

  if (post && commentsOpen) return <div className="app-page bg-background">
    <TopBar title={tr(lang, { en: "Comments", ko: "댓글", zh: "评论" })} left={<BackBtn onClick={() => { setCommentsOpen(false); setCommentDraft(null); }} />} />
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      <p className="border-b pb-3 text-sm"><b>{postAuthor.username}</b> {post.caption}</p>
      {post.comments.map((c) => <div key={c.id} className="flex gap-2 items-start"><span className="ig-comment-avatar"><User size={18} /></span><div className="flex-1 min-w-0 text-sm"><b>{c.user}</b><p className="whitespace-pre-wrap break-words">{c.text}</p>{c.date && <span className="text-xs text-muted-foreground">{c.date} {c.time}</span>}<div className="flex gap-3"><Button variant="ghost" size="sm" onClick={() => setCommentDraft({ id: c.id, text: c.text })}>{label(lang, "edit")}</Button><Button variant="ghost" size="sm" onClick={() => setComment(`@${c.user} `)}>{label(lang, "reply")}</Button><Button variant="ghost" size="icon" aria-label={label(lang, "delete")} onClick={() => { if (confirmDelete(lang)) updatePost(post.id, (p) => ({ ...p, comments: p.comments.filter((x) => x.id !== c.id) })); }}><Trash2 size={14} /></Button></div></div></div>)}
      {commentDraft && <div className="space-y-2"><input className="sheet-input" aria-label={tr(lang, { en: "Edit comment", ko: "댓글 수정", zh: "编辑评论" })} value={commentDraft.text} onChange={(e) => setCommentDraft({ ...commentDraft, text: e.target.value })} /><Button onClick={() => { updatePost(post.id, (p) => ({ ...p, comments: p.comments.map((c) => c.id === commentDraft.id ? { ...c, text: commentDraft.text } : c) })); setCommentDraft(null); }}>{S}</Button><Button variant="ghost" onClick={() => setCommentDraft(null)}>{C}</Button></div>}
    </div>
    <form className="kkt-input" onSubmit={(e) => { e.preventDefault(); if (!comment.trim()) return; updatePost(post.id, (p) => ({ ...p, comments: [...p.comments, { id: uid(), user: prof.username, text: comment.trim(), date: STORY_DATE, time: "20:26" }] })); setComment(""); }}><input className="kkt-compose" aria-label={tr(lang, { en: "Add comment", ko: "댓글 입력", zh: "输入评论" })} value={comment} onChange={(e) => setComment(e.target.value)} /><Button size="icon" aria-label={tr(lang, { en: "Post comment", ko: "댓글 게시", zh: "发布评论" })} disabled={!comment.trim()}><Send /></Button></form>
  </div>;

  if (post)
    return (
      <div className="app-page bg-background">
        <TopBar left={<BackBtn onClick={() => { setOpenId(null); setCommentsOpen(false); }} />} title={tr(lang, { en: "Posts", ko: "게시물", zh: "帖子" })}
          right={<Button variant="ghost" size="sm" onClick={() => setDraft({ ...post, comments: post.comments.map((c) => ({ ...c })) })}>{post.authorId === SELF_ID ? label(lang, "edit") : tr(lang, { en: "Manage post", ko: "게시물 관리", zh: "管理编辑" })}</Button>} />
        <div className="flex-1 overflow-y-auto">
          <Button variant="ghost" className="h-auto w-full justify-start gap-2 py-2" onClick={() => showProfile(post.authorId)}><img src={resolveImg(postAuthor.avatar)} alt="" className="w-8 h-8 rounded-full object-cover ig-ring" /><b>{postAuthor.username}</b></Button>
          <div className="relative aspect-square bg-muted">
            {postImages(post)[imageIndex] && <img src={resolveImg(postImages(post)[imageIndex])} alt="" className="w-full h-full object-contain" />}
            {imageIndex > 0 && <Button variant="secondary" size="icon" className="absolute left-2 top-1/2" onClick={() => setImageIndex(imageIndex - 1)}>‹</Button>}
            {imageIndex < postImages(post).length - 1 && <Button variant="secondary" size="icon" className="absolute right-2 top-1/2" onClick={() => setImageIndex(imageIndex + 1)}>›</Button>}
            {postImages(post).length > 1 && <span className="absolute bottom-2 right-2 bg-background text-foreground px-2 text-xs">{imageIndex + 1}/{postImages(post).length}</span>}
          </div>
          <div className="px-3 py-2 space-y-1.5 text-sm">
            {interactions(post)}
            <b>{post.likes.toLocaleString()} {tr(lang, { en: "likes", ko: "좋아요", zh: "次赞" })}</b>
            <p><b>{postAuthor.username}</b> {post.caption}</p>
            <Button variant="ghost" className="px-0 h-auto text-muted-foreground" onClick={() => setCommentsOpen(true)}>{tr(lang, { en: `View all ${post.comments.length} comments`, ko: `댓글 ${post.comments.length}개 모두 보기`, zh: `查看全部 ${post.comments.length} 条评论` })}</Button>
            {post.comments.slice(0, 2).map((c) => <p key={c.id}><b>{c.user}</b> {c.text}</p>)}
            <p className="text-xs text-muted-foreground">{post.date.replaceAll("-", ".")} {post.time}</p>
          </div>
        </div>
        {share}
      </div>
    );

  if (tab !== "profile") return <div className="app-page bg-background">
    <header className="ig-header"><Button variant="ghost" size="icon" aria-label={C} onClick={onHome}><ChevronLeft /></Button><span className="ig-logo">Instagram</span><span className="flex-1" /><Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Notifications", ko: "알림", zh: "通知" })}><Heart strokeWidth={1.8} /></Button><Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Messages", ko: "메시지", zh: "私信" })} onClick={() => setDm(true)}><Send strokeWidth={1.8} /></Button></header>
    <div className="flex-1 overflow-y-auto">
      {tab === "home" ? <><Stories posts={sorted} profile={prof} accounts={accounts} lang={lang} onProfile={showProfile} />{sorted.map((p) => <article key={p.id} className="border-b pb-3">
        <Button variant="ghost" className="h-auto w-full justify-start gap-2 py-2" onClick={() => showProfile(p.authorId)}><img src={resolveImg(account(p.authorId).avatar)} className="w-8 h-8 rounded-full object-cover ig-ring" alt="" /><b className="text-[13px]">{account(p.authorId).username}</b><MoreHorizontal className="ml-auto" size={18} /></Button>
        <Button variant="ghost" className="ig-feed-photo" aria-label={tr(lang, { en: "Open post", ko: "게시물 열기", zh: "打开帖子" })} onClick={() => { setOpenId(p.id); setImageIndex(0); }}>{postImages(p)[0] && <img src={resolveImg(postImages(p)[0])} alt="" loading="lazy" />}{postImages(p).length > 1 && <span className="ig-image-count">1/{postImages(p).length}</span>}</Button>
        <div className="px-3 text-sm">{interactions(p)}<b>{p.likes.toLocaleString()} {tr(lang, { en: "likes", ko: "좋아요", zh: "次赞" })}</b><p className="whitespace-pre-wrap mt-1"><b>{account(p.authorId).username}</b> {p.caption}</p><Button variant="ghost" className="px-0 h-auto text-muted-foreground mt-2" onClick={() => { setOpenId(p.id); setCommentsOpen(true); }}>{tr(lang, { en: `View all ${p.comments.length} comments`, ko: `댓글 ${p.comments.length}개 모두 보기`, zh: `查看全部 ${p.comments.length} 条评论` })}</Button><p className="text-xs text-muted-foreground mt-2">{p.date}</p></div>
      </article>)}</> : <><div className="p-3"><input className="sheet-input" aria-label={label(lang, "search")} placeholder={label(lang, "search")} value={query} onChange={(e) => setQuery(e.target.value)} /></div><div className="grid grid-cols-3 gap-0.5">{sorted.filter((p) => `${p.caption} ${account(p.authorId).username}`.toLowerCase().includes(query.toLowerCase())).map((p) => <Button variant="ghost" key={p.id} className="ig-search-photo" onClick={() => { setOpenId(p.id); setImageIndex(0); }}><img src={resolveImg(postImages(p)[0])} alt="" /></Button>)}</div></>}
    </div>{nav}{share}
  </div>;

  return (
    <div className="app-page bg-background">
      <TopBar left={<BackBtn onClick={() => { if (profileId === SELF_ID) onHome(); else { setTab("home"); setProfileId(SELF_ID); } }} />} title={selectedProfile.username}
        right={<Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Messages", ko: "메시지", zh: "私信" })} onClick={() => setDm(true)}><Send /></Button>} />
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center gap-5 px-4 pt-3">
          <img src={resolveImg(selectedProfile.avatar)} alt="" className="w-20 h-20 rounded-full object-cover ig-ring" />
          <div className="flex flex-1 justify-around text-center text-sm">
            <div><b className="block text-base">{profilePosts.length}</b>{tr(lang, { en: "posts", ko: "게시물", zh: "帖子" })}</div>
            <div><b className="block text-base">{selectedProfile.followers}</b>{tr(lang, { en: "followers", ko: "팔로워", zh: "粉丝" })}</div>
            <div><b className="block text-base">{selectedProfile.following}</b>{tr(lang, { en: "following", ko: "팔로잉", zh: "关注" })}</div>
          </div>
        </div>
        <div className="px-4 py-2 text-sm whitespace-pre-line"><b>{selectedProfile.name}</b>{"\n"}{selectedProfile.bio}</div>
        <div className="px-4 pb-3"><button className="w-full py-1.5 rounded-lg bg-muted text-sm font-semibold" onClick={() => setProfDraft({ ...selectedProfile })}>{profileId === SELF_ID ? tr(lang, { en: "Edit profile", ko: "프로필 편집", zh: "编辑主页" }) : tr(lang, { en: "Manage profile", ko: "프로필 관리", zh: "管理主页" })}</button></div>
        <div className="grid grid-cols-3 gap-0.5">
          {profilePosts.map((p) => (
            <button key={p.id} onClick={() => { setOpenId(p.id); setImageIndex(0); }} className="aspect-square bg-muted">
              {postImages(p)[0] && <img src={resolveImg(postImages(p)[0])} alt="" className="w-full h-full object-cover" loading="lazy" />}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-center text-muted-foreground py-3">{label(lang, "fictional")}</p>
      </div>
      {nav}{share}
    </div>
  );
}
