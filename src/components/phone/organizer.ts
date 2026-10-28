export type CalendarEvent = { id: string; title: string; date: string; time: string; note: string };
export type Song = { id: string; title: string; artist: string; favorite: boolean; audio?: string };
export type Playlist = { id: string; name: string; songIds: string[] };
export type MusicData = { songs: Song[]; playlists: Playlist[]; referenceTracksAdded?: boolean };
export const EMPTY_MUSIC: MusicData = { songs: [], playlists: [] };
export function monthCells(year: number, month: number): (number | null)[] {
  const offset = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  return [...Array.from({ length: offset }, () => null), ...Array.from({ length: days }, (_, i) => i + 1)];
}