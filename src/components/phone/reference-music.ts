import type { MusicData, Song } from "./organizer";
const tracks = [
  ["bad", "wave to earth"],
  ["String (feat. sunwoojunga)", "Colde"],
  ["넘어와 (feat. 백예린)", "DEAN"],
  ["Fall", "Crush"],
  ["Sunny Days, Summer Nights", "Sam Kim"],
  ["Dance", "offonoff"],
  ["그건 아마 우리의 잘못은 아닐 거야", "Yerin Baek"],
  ["EVERYTHING", "The Black Skirts"],
  ["peach eyes", "wave to earth"],
  ["Kids (Live)", "Current Joys"],
  ["West Coast", "Lana Del Rey"],
  ["Glimpse of Us", "Joji"],
];
export const REFERENCE_SONGS: Song[] = tracks.map(([title = "", artist = ""], i) => ({ id: `reference-song-${i + 1}`, title, artist, favorite: false }));
export function addReferenceSongs(data: MusicData): MusicData {
  if (data.referenceTracksAdded) return data;
  const norm = (s: string) => s.trim().toLowerCase();
  const additions = REFERENCE_SONGS.filter((song) => !data.songs.some((s) => s.id === song.id || (norm(s.title) === norm(song.title) && norm(s.artist) === norm(song.artist))));
  return { ...data, songs: [...data.songs, ...additions], referenceTracksAdded: true };
}