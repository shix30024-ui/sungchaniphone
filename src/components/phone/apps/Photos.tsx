import { useState } from "react";
import { type AppProps, tr } from "../i18n";
import { ALBUMS, type Album, type Photo } from "../story";
import { fileToDataUrl, uid, usePersist } from "../store";
import { label, confirmDelete } from "../labels";
import { movePhoto } from "../media";
import { Button } from "@/components/ui/button";
import { Pencil, Heart, Info, Trash2, Share } from "lucide-react";
import { PhotoImg, putPhotoImage } from "../photo-db";
import { BackBtn, EditBar, Field, TopBar } from "../ui";
import { useOwner } from "../owner";

export default function Photos({ lang, onHome }: AppProps) {
  const owner = useOwner();
  const [albums, setAlbums] = usePersist<Album[]>("photos-v1", ALBUMS);
  const [aid, setAid] = useState<string | null>(null);
  const [pid, setPid] = useState<string | null>(null);
  const [targetAlbum, setTargetAlbum] = useState<string>("");
  const [draft, setDraft] = useState<Photo | null>(null);
  const [info, setInfo] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const pick = async (f?: File) => (f ? putPhotoImage(await fileToDataUrl(f, 1600)) : "");
  const album = albums.find((a) => a.id === aid);
  const photos = album ? [...album.photos].sort((a, b) => a.date.localeCompare(b.date)) : [];
  const photo = photos.find((p) => p.id === pid);
  const saveAlbum = (a: Album) => setAlbums(albums.map((x) => (x.id === a.id ? a : x)));

  if (album && photo) {
    const idx = photos.indexOf(photo);
    if (draft)
      return (
        <div className="app-page bg-background">
          <TopBar title={tr(lang, { en: "Edit", ko: "편집", zh: "编辑" })} />
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center gap-2"><PhotoImg src={draft.image} alt="" className="w-12 h-12 rounded-md object-cover" /><label className="edit-chip cursor-pointer">{tr(lang, { en: "Replace", ko: "사진 변경", zh: "替换图片" })}<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const input = e.currentTarget; try { const v = await pick(input.files?.[0]); if (v) setDraft({ ...draft, image: v }); } catch { alert(tr(lang, { en: "Could not open image", ko: "이미지를 열 수 없습니다", zh: "无法打开图片" })); } finally { input.value = ""; } }} /></label></div>
            <Field label={tr(lang, { en: "Date", ko: "날짜", zh: "日期" })}><input type="date" className="sheet-input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field>
            <Field label={tr(lang, { en: "Caption", ko: "메모", zh: "备注" })}><input className="sheet-input" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></Field>
            <Field label={label(lang, "move")}><select className="sheet-input" value={targetAlbum || album.id} onChange={(e) => setTargetAlbum(e.target.value)}>{albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
            <button className="w-full py-2.5 rounded-xl bg-muted text-destructive" onClick={() => { if (!confirmDelete(lang)) return; saveAlbum({ ...album, photos: album.photos.filter((p) => p.id !== draft.id) }); setDraft(null); setPid(null); }}>{tr(lang, { en: "Delete photo", ko: "사진 삭제", zh: "删除照片" })}</button>
          </div>
          <EditBar save={tr(lang, { en: "Save", ko: "저장", zh: "保存" })} cancel={tr(lang, { en: "Cancel", ko: "취소", zh: "取消" })}
            onCancel={() => setDraft(null)} onSave={() => { const updated = albums.map((a) => a.id === album.id ? { ...a, photos: a.photos.map((p) => p.id === draft.id ? draft : p) } : a); setAlbums(movePhoto(updated, album.id, targetAlbum || album.id, draft.id)); if (targetAlbum && targetAlbum !== album.id) setPid(null); setDraft(null); setTargetAlbum(""); }} />
        </div>
      );
    const [y, m, d] = photo.date.split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    const loc = lang === "ko" ? "ko-KR" : lang === "zh" ? "zh-CN" : "en-US";
    return (
      <div className="app-page photo-viewer">
        <div className="pv-top">
          <BackBtn onClick={() => { setPid(null); setInfo(false); }} />
          <div className="pv-title"><b>{dt.toLocaleDateString(loc, { year: "numeric", month: "long", day: "numeric" })}</b><small>{album.name}</small></div>
          {owner ? <button className="pv-edit" onClick={() => { setDraft({ ...photo }); setTargetAlbum(album.id); }}>{tr(lang, { en: "Edit", ko: "편집", zh: "编辑" })}</button> : <span className="pv-edit" />}
        </div>
        <div className="pv-stage" onTouchStart={(e) => { (e.currentTarget as HTMLElement).dataset.x = String(e.touches[0].clientX); }} onTouchEnd={(e) => { const x0 = Number((e.currentTarget as HTMLElement).dataset.x); const dx = e.changedTouches[0].clientX - x0; if (dx > 50 && idx > 0) setPid(photos[idx - 1].id); if (dx < -50 && idx < photos.length - 1) setPid(photos[idx + 1].id); }}>
          <PhotoImg src={photo.image} alt={photo.note} />
          {idx > 0 && <button className="viewer-nav left-2" aria-label="Previous" onClick={() => setPid(photos[idx - 1]?.id ?? null)}>‹</button>}
          {idx < photos.length - 1 && <button className="viewer-nav right-2" aria-label="Next" onClick={() => setPid(photos[idx + 1]?.id ?? null)}>›</button>}
        </div>
        {info && <div className="pv-info"><b>{dt.toLocaleDateString(loc, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</b>{photo.note && <p>{photo.note}</p>}<small>{album.name} · {idx + 1} / {photos.length}</small></div>}
        <div className="pv-strip">{photos.map((p) => <button key={p.id} className={p.id === photo.id ? "on" : ""} onClick={() => setPid(p.id)}><PhotoImg src={p.image} alt="" loading="lazy" /></button>)}</div>
        <div className="pv-bar">
          <button aria-label="Share"><Share size={22} /></button>
          <button aria-label="Favorite" onClick={() => setLiked({ ...liked, [photo.id]: !liked[photo.id] })}><Heart size={22} fill={liked[photo.id] ? "currentColor" : "none"} /></button>
          <button aria-label="Info" aria-pressed={info} onClick={() => setInfo(!info)}><Info size={22} /></button>
          {owner ? <button aria-label="Delete" onClick={() => { if (!confirmDelete(lang)) return; saveAlbum({ ...album, photos: album.photos.filter((p) => p.id !== photo.id) }); setPid(null); }}><Trash2 size={22} /></button> : <span />}
        </div>
      </div>
    );
  }

  if (album)
    return (
      <div className="app-page bg-background">
        <TopBar left={<BackBtn onClick={() => setAid(null)} />} title={<span className="flex items-center justify-center gap-1 truncate">{album.name}{owner && <Button size="icon" variant="ghost" aria-label={label(lang, "rename")} onClick={() => { const name = prompt(label(lang, "rename"), album.name); if (name?.trim()) saveAlbum({ ...album, name }); }}><Pencil /></Button>}</span>}
          right={owner && <label className="text-xl cursor-pointer">＋<input type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const input = e.currentTarget;
            const f = input.files?.[0];
            try { if (f) { const image = await pick(f); setAlbums((current) => current.map((a) => a.id === album.id ? { ...a, photos: [...a.photos, { id: uid(), image, date: "2026-10-26", note: "" }] } : a)); } }
            catch { alert(tr(lang, { en: "Could not open image", ko: "이미지를 열 수 없습니다", zh: "无法打开图片" })); }
            finally { input.value = ""; }
          }} /></label>} />
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-0.5">
            {photos.map((p) => (
              <button key={p.id} className="aspect-square" onClick={() => setPid(p.id)}>
                <PhotoImg src={p.image} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground py-4">{photos.length} {tr(lang, { en: "photos", ko: "장", zh: "张照片" })}</p>
          {owner && <button className="mx-auto block text-sm text-destructive pb-6" onClick={() => {
            if (confirm(tr(lang, { en: "Delete this album?", ko: "앨범을 삭제할까요?", zh: "删除这个相簿？" }))) { setAlbums(albums.filter((a) => a.id !== album.id)); setAid(null); }
          }}>{tr(lang, { en: "Delete album", ko: "앨범 삭제", zh: "删除相簿" })}</button>}
        </div>
      </div>
    );

  return (
    <div className="app-page bg-background">
      <TopBar left={<BackBtn onClick={onHome} />} title={tr(lang, { en: "Albums", ko: "앨범", zh: "相簿" })}
        right={owner && <button className="text-xl" onClick={() => {
          const name = prompt(tr(lang, { en: "Album name", ko: "앨범 이름", zh: "相簿名称" }));
          if (name) setAlbums([...albums, { id: uid(), name, photos: [] }]);
        }}>＋</button>} />
      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 p-4 content-start">
        {albums.map((a) => (
          <button key={a.id} className="text-left" onClick={() => setAid(a.id)}>
            <div className="aspect-square rounded-xl overflow-hidden bg-muted">
              {a.photos[0] && <PhotoImg src={a.photos.at(-1)?.image} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="text-sm font-medium mt-1">{a.name}</div>
            <div className="text-xs text-muted-foreground">{a.photos.length}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
