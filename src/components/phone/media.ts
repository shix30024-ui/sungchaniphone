import type { Album, Post } from "./story";
export const postImages = (post: Post): string[] => post.images ?? (post.image ? [post.image] : []);
export function moveImage(images: string[], index: number, direction: -1 | 1) {
  const next = [...images];
  const target = index + direction;
  const value = next[index];
  const other = next[target];
  if (value === undefined || other === undefined) return next;
  next[index] = other;
  next[target] = value;
  return next;
}
export function movePhoto(albums: Album[], source: string, target: string, photoId: string): Album[] {
  if (source === target) return albums;
  const photo = albums.find((a) => a.id === source)?.photos.find((p) => p.id === photoId);
  if (!photo || !albums.some((a) => a.id === target)) return albums;
  return albums.map((a) => a.id === source ? { ...a, photos: a.photos.filter((p) => p.id !== photoId) } : a.id === target ? { ...a, photos: [...a.photos, photo] } : a);
}