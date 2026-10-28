import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Heart, Trash2, Pencil, Music2, ListMusic, ChevronRight } from "lucide-react";
import { tr, type AppProps } from "../i18n";
import { label, confirmDelete } from "../labels";
import { EMPTY_MUSIC, type MusicData, type Song, type Playlist } from "../organizer";
import { usePersist, uid, readStored, updateStored } from "../store";
import { addReferenceSongs } from "../reference-music";
import { BackBtn, TopBar, Field, EditBar } from "../ui";
import { useOwner } from "../owner";

export default function Music({ lang, onHome }: AppProps) {
  const owner = useOwner();
  const [data, setData] = usePersist<MusicData>("music-library-v1", EMPTY_MUSIC);
  useEffect(() => {
    try {
      const current = readStored<MusicData>("music-library-v1", EMPTY_MUSIC);
      if (!current.referenceTracksAdded) updateStored<MusicData>("music-library-v1", EMPTY_MUSIC, addReferenceSongs);
    } catch { /* Unreadable saved music must never be replaced. */ }
  }, []);
  const [tab, setTab] = useState<"songs" | "playlists" | "favorites">("songs");
  const [library, setLibrary] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [songDraft, setSongDraft] = useState<Song | null>(null);
  const [playlistDraft, setPlaylistDraft] = useState<Playlist | null>(null);
  const open = data.playlists.find((p) => p.id === openId);
  if (songDraft || playlistDraft) return <div className="app-page bg-background"><TopBar title={label(lang, "edit")} />
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {songDraft && <><Field label={label(lang, "songTitle")}><input className="sheet-input" value={songDraft.title} onChange={(e) => setSongDraft({ ...songDraft, title: e.target.value })} /></Field><Field label={label(lang, "artist")}><input className="sheet-input" value={songDraft.artist} onChange={(e) => setSongDraft({ ...songDraft, artist: e.target.value })} /></Field></>}
      {playlistDraft && <><Field label={label(lang, "playlistName")}><input className="sheet-input" value={playlistDraft.name} onChange={(e) => setPlaylistDraft({ ...playlistDraft, name: e.target.value })} /></Field>{data.songs.map((song) => <label key={song.id} className="flex gap-3 items-center py-2"><input type="checkbox" checked={playlistDraft.songIds.includes(song.id)} onChange={(e) => setPlaylistDraft({ ...playlistDraft, songIds: e.target.checked ? [...playlistDraft.songIds, song.id] : playlistDraft.songIds.filter((id) => id !== song.id) })} />{song.title} · {song.artist}</label>)}</>}
    </div>
    <EditBar save={label(lang, "save")} cancel={label(lang, "cancel")} onCancel={() => { setSongDraft(null); setPlaylistDraft(null); }} onSave={() => {
      setData((current) => ({ ...current,
        songs: songDraft?.title.trim() ? current.songs.some((s) => s.id === songDraft.id) ? current.songs.map((s) => s.id === songDraft.id ? songDraft : s) : [...current.songs, songDraft] : current.songs,
        playlists: playlistDraft?.name.trim() ? current.playlists.some((p) => p.id === playlistDraft.id) ? current.playlists.map((p) => p.id === playlistDraft.id ? playlistDraft : p) : [...current.playlists, playlistDraft] : current.playlists,
      }));
      setSongDraft(null); setPlaylistDraft(null);
    }} />
  </div>;
  const songs = data.songs.filter((song) => open ? open.songIds.includes(song.id) : tab !== "favorites" || song.favorite);
  return <div className="app-page bg-background music-native"><TopBar className="native-clean-top" left={<BackBtn onClick={open ? () => setOpenId(null) : library ? onHome : () => setLibrary(true)} />} title={open?.name ?? ""} right={owner && <Button variant="ghost" size="icon" aria-label={label(lang, open ? "edit" : "add")} onClick={() => open ? setPlaylistDraft({ ...open, songIds: [...open.songIds] }) : !library && tab === "playlists" ? setPlaylistDraft({ id: uid(), name: "", songIds: [] }) : setSongDraft({ id: uid(), title: "", artist: "", favorite: false })}>{open ? <Pencil /> : <Plus />}</Button>} />
    {!open && <h1 className="native-large-title">{library ? tr(lang, { en: "Library", ko: "보관함", zh: "资料库" }) : label(lang, tab)}</h1>}
    {library && !open ? <div className="flex-1 overflow-y-auto music-library-menu">{(["songs", "playlists", "favorites"] as const).map((value) => <Button variant="ghost" key={value} onClick={() => { setTab(value); setLibrary(false); }}><span>{label(lang, value)}</span><ChevronRight size={18} /></Button>)}</div> : <div className="flex-1 overflow-y-auto p-4 music-song-list">
      {!open && tab === "playlists" ? data.playlists.map((playlist) => <div key={playlist.id} className="flex items-center border-b py-2"><Button variant="ghost" className="flex-1 justify-start h-auto whitespace-normal" onClick={() => setOpenId(playlist.id)}>{playlist.name} ({playlist.songIds.length})</Button>{owner && <Button variant="ghost" size="icon" aria-label={label(lang, "delete")} onClick={() => { if (confirmDelete(lang)) setData({ ...data, playlists: data.playlists.filter((p) => p.id !== playlist.id) }); }}><Trash2 /></Button>}</div>) : songs.map((song) => <div key={song.id} className="border-b py-2"><div className="flex items-center gap-2"><Button variant="ghost" className="flex-1 h-auto text-left justify-start whitespace-normal" onClick={() => owner && setSongDraft({ ...song })}><span><b className="block">{song.title}</b><span className="text-muted-foreground text-xs">{song.artist}</span></span></Button><Button variant="ghost" size="icon" aria-label={label(lang, "favorites")} aria-pressed={song.favorite} onClick={() => setData({ ...data, songs: data.songs.map((s) => s.id === song.id ? { ...s, favorite: !s.favorite } : s) })}><Heart className={song.favorite ? "fill-destructive text-destructive" : ""} /></Button>{open && owner && <Button variant="ghost" size="icon" aria-label={label(lang, "delete")} onClick={() => { if (confirmDelete(lang)) setData({ ...data, playlists: data.playlists.map((p) => p.id === open.id ? { ...p, songIds: p.songIds.filter((id) => id !== song.id) } : p) }); }}><Trash2 /></Button>}</div>{song.audio && <audio controls src={song.audio} className="w-full" />}</div>)}
      {(tab === "playlists" && !open ? data.playlists.length === 0 : songs.length === 0) && <p className="text-sm text-muted-foreground">{label(lang, "empty")}</p>}
    </div>}
    {!open && <nav className="system-app-tabs music-tabs">{(["songs", "playlists", "favorites"] as const).map((value) => <Button key={value} variant="ghost" aria-pressed={!library && tab === value} onClick={() => { setTab(value); setLibrary(false); }}>{value === "songs" ? <Music2 /> : value === "playlists" ? <ListMusic /> : <Heart />}<span>{label(lang, value)}</span></Button>)}</nav>}
  </div>;
}