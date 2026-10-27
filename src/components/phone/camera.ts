import { ALBUMS, type Album, type Photo } from "./story";
import { updateStored } from "./store";
export const CAMERA_ALBUM_ID = "phone-camera-roll";
export function appendCameraPhoto(albums: Album[], photo: Photo, albumName: string): Album[] {
 if (albums.some((a) => a.photos.some((p) => p.id === photo.id))) return albums;
 const existing = albums.some((a) => a.id === CAMERA_ALBUM_ID);
 return existing ? albums.map((a) => a.id === CAMERA_ALBUM_ID ? { ...a, photos: [...a.photos, photo] } : a) : [...albums, { id: CAMERA_ALBUM_ID, name: albumName, photos: [photo] }];
}
export function saveCameraPhoto(photo: Photo, albumName: string) { return updateStored<Album[]>("photos-v1", ALBUMS, (albums) => appendCameraPhoto(albums, photo, albumName)); }
