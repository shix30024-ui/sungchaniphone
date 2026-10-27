import { useState } from "react";
import { type AppProps, tr } from "../i18n";
import { ALBUMS, type Album, type Photo } from "../story";
import { fileToDataUrl, uid, usePersist } from "../store";
import { BackBtn, EditBar, Field, ImageField, TopBar, resolveImg } from "../ui";

export default function Photos({ lang, onHome }: AppProps) {
  const [albums, setAlbums] = usePersist<Album[]>("photos-v1", ALBUMS);
  const [aid, setAid] = useState<string | null>(null);
  const [pid, setPid] = useState<string | null>(null);
  const [draft, setDraft] = useState<Photo | null>(null);
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
            <ImageField label={tr(lang, { en: "Replace", ko: "사진 변경", zh: "替换图片" })} value={draft.image} onChange={(v) => setDraft({ ...draft, image: v })} />
            <Field label={tr(lang, { en: "Date", ko: "날짜", zh: "日期" })}><input type="date" className="sheet-input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field>
            <Field label={tr(lang, { en: "Caption", ko: "메모", zh: "备注" })}><input className="sheet-input" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></Field>
            <button className="w-full py-2.5 rounded-xl bg-muted text-destructive" onClick={() => { saveAlbum({ ...album, photos: album.photos.filter((p) => p.id !== draft.id) }); setDraft(null); setPid(null); }}>{tr(lang, { en: "Delete photo", ko: "사진 삭제", zh: "删除照片" })}</button>
          </div>
          <EditBar save={tr(lang, { en: "Save", ko: "저장", zh: "保存" })} cancel={tr(lang, { en: "Cancel", ko: "취소", zh: "取消" })}
            onCancel={() => setDraft(null)} onSave={() => { saveAlbum({ ...album, photos: album.photos.map((p) => (p.id === draft.id ? draft : p)) }); setDraft(null); }} />
        </div>
      );
    return (
      <div className="app-page photo-viewer">
        <TopBar className="photo-viewer-top" left={<BackBtn onClick={() => setPid(null)} />} title={<span className="text-sm">{photo.date.replaceAll("-", ".")}</span>}
          right={<button className="text-sm" onClick={() => setDraft({ ...photo })}>{tr(lang, { en: "Edit", ko: "편집", zh: "编辑" })}</button>} />
        <div className="flex-1 flex items-center justify-center relative">
          <img src={resolveImg(photo.image)} alt={photo.note} className="max-w-full max-h-full object-contain" />
          {idx > 0 && <button className="viewer-nav left-2" onClick={() => setPid(photos[idx - 1]?.id ?? null)}>‹</button>}
          {idx < photos.length - 1 && <button className="viewer-nav right-2" onClick={() => setPid(photos[idx + 1]?.id ?? null)}>›</button>}
        </div>
        <div className="p-4 text-sm text-center opacity-80">{photo.note}</div>
      </div>
    );
  }

  if (album)
    return (
      <div className="app-page bg-background">
        <TopBar left={<BackBtn onClick={() => setAid(null)} />} title={album.name}
          right={<label className="text-xl cursor-pointer">＋<input type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) saveAlbum({ ...album, photos: [...album.photos, { id: uid(), image: await fileToDataUrl(f), date: `${/^\d{4}$/.test(album.name) ? album.name : "2026"}-10-26`, note: "" }] });
          }} /></label>} />
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-0.5">
            {photos.map((p) => (
              <button key={p.id} className="aspect-square" onClick={() => setPid(p.id)}>
                <img src={resolveImg(p.image)} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground py-4">{photos.length} {tr(lang, { en: "photos", ko: "장", zh: "张照片" })}</p>
          <button className="mx-auto block text-sm text-destructive pb-6" onClick={() => {
            if (confirm(tr(lang, { en: "Delete this album?", ko: "앨범을 삭제할까요?", zh: "删除这个相簿？" }))) { setAlbums(albums.filter((a) => a.id !== album.id)); setAid(null); }
          }}>{tr(lang, { en: "Delete album", ko: "앨범 삭제", zh: "删除相簿" })}</button>
        </div>
      </div>
    );

  return (
    <div className="app-page bg-background">
      <TopBar left={<BackBtn onClick={onHome} />} title={tr(lang, { en: "Albums", ko: "앨범", zh: "相簿" })}
        right={<button className="text-xl" onClick={() => {
          const name = prompt(tr(lang, { en: "Album name", ko: "앨범 이름", zh: "相簿名称" }));
          if (name) setAlbums([...albums, { id: uid(), name, photos: [] }]);
        }}>＋</button>} />
      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 p-4 content-start">
        {albums.map((a) => (
          <button key={a.id} className="text-left" onClick={() => setAid(a.id)}>
            <div className="aspect-square rounded-xl overflow-hidden bg-muted">
              {a.photos[0] && <img src={resolveImg(a.photos.at(-1)?.image)} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="text-sm font-medium mt-1">{a.name}</div>
            <div className="text-xs text-muted-foreground">{a.photos.length}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
