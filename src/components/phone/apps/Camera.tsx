import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera as CameraIcon, ChevronLeft, RotateCw, Grid3X3, ImagePlus, X, Check, ZapOff } from "lucide-react";
import { type AppProps, tr } from "../i18n";
import { uid, fileToDataUrl } from "../store";
import { saveCameraPhoto } from "../camera";

export default function Camera({ lang, onHome }: AppProps) {
 const video = useRef<HTMLVideoElement>(null);
 const stream = useRef<MediaStream | null>(null);
 const generation = useRef(0);
 const upload = useRef<HTMLInputElement>(null);
 const [facing, setFacing] = useState<"environment" | "user">("environment");
 const [active, setActive] = useState(false);
 const [pending, setPending] = useState(false);
 const [grid, setGrid] = useState(false);
 const [photo, setPhoto] = useState("");
 const [lastPhoto, setLastPhoto] = useState("");
 const [error, setError] = useState("");
 const L = (en: string, ko: string, zh: string) => tr(lang, { en, ko, zh });
 const stop = () => { stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null; };
 useEffect(() => { const hide = () => { if (document.hidden) { generation.current++; stop(); setActive(false); setPending(false); } }; document.addEventListener("visibilitychange", hide); return () => { generation.current++; stop(); document.removeEventListener("visibilitychange", hide); }; }, []);
 const start = async (next = facing) => {
  const request = ++generation.current;
  stop(); setPending(true); setError(""); setActive(false);
  try {
   if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
   const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: next } }, audio: false });
   if (request !== generation.current) { media.getTracks().forEach((track) => track.stop()); return; }
   stream.current = media; setFacing(next);
   if (video.current) { video.current.srcObject = media; await video.current.play(); }
   setActive(true);
  } catch (e) { if (request !== generation.current) return; stop(); setError(e instanceof DOMException && e.name === "NotAllowedError" ? L("Camera access denied. Allow camera access in your browser, then retry.", "카메라 권한이 거부되었습니다. 브라우저에서 허용한 후 다시 시도하세요.", "相机权限被拒绝，请在浏览器中允许相机后重试。") : L("Camera unavailable. Retry or choose a photo.", "카메라를 사용할 수 없습니다. 다시 시도하거나 사진을 선택하세요.", "相机暂不可用，请重试或选择照片。")); }
  finally { if (request === generation.current) setPending(false); }
 };
 const capture = () => {
  const source = video.current;
  if (!source || !active || !source.videoWidth) return;
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 1000 / Math.max(source.videoWidth, source.videoHeight));
  canvas.width = source.videoWidth * scale; canvas.height = source.videoHeight * scale;
  const ctx = canvas.getContext("2d"); if (!ctx) return;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height); setPhoto(canvas.toDataURL("image/jpeg", .82));
 };
 return <div className="app-page camera-native"><header className="camera-top"><Button variant="ghost" size="icon" aria-label={L("Home", "홈", "主屏幕")} onClick={onHome}><ChevronLeft /></Button><ZapOff size={21} /><Button variant="ghost" size="icon" aria-label={L("Grid", "격자", "网格")} aria-pressed={grid} onClick={() => setGrid(!grid)}><Grid3X3 /></Button></header><div className="camera-viewfinder"><video ref={video} autoPlay muted playsInline className={facing === "user" ? "camera-mirrored" : ""} />{grid && <div className="camera-grid" aria-hidden="true" />}{photo && <img className="camera-captured" src={photo} alt={L("Captured photo", "촬영한 사진", "拍摄的照片")} />}{!photo && !active && <div className="camera-permission"><CameraIcon size={42} /><Button disabled={pending} onClick={() => void start()}>{pending ? L("Opening…", "여는 중…", "正在打开…") : L("Open camera", "카메라 열기", "打开相机")}</Button>{error && <p role="alert">{error}</p>}</div>}</div><div className="camera-bottom"><p className="camera-mode">{L("PHOTO", "사진", "照片")}</p>{photo ? <div className="camera-review"><Button variant="ghost" onClick={() => { setPhoto(""); setError(""); }}><X />{L("Retake", "다시 촬영", "重拍")}</Button><Button variant="ghost" onClick={() => { try { const now = new Date(); const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`; saveCameraPhoto({ id: uid(), image: photo, date, note: "" }, L("Camera Roll", "카메라 롤", "相机胶卷")); setLastPhoto(photo); setPhoto(""); setError(""); } catch { setError(L("Could not save photo. Storage may be full.", "사진을 저장하지 못했습니다. 저장 공간을 확인하세요.", "照片未保存，存储空间可能已满。")); } }}><Check />{L("Save photo", "사진 저장", "保存照片")}</Button></div> : <div className="camera-controls"><Button variant="ghost" size="icon" aria-label={L("Choose photo", "사진 선택", "选择照片")} onClick={() => upload.current?.click()}>{lastPhoto ? <img src={lastPhoto} alt="" /> : <ImagePlus />}</Button><Button className="camera-shutter" size="icon" disabled={!active} aria-label={L("Take photo", "사진 촬영", "拍照")} onClick={capture}><span /></Button><Button variant="ghost" size="icon" disabled={pending} aria-label={L("Switch camera", "카메라 전환", "切换相机")} onClick={() => void start(facing === "user" ? "environment" : "user")}><RotateCw /></Button></div>}{photo && error && <p className="camera-save-error" role="alert">{error}</p>}</div><input ref={upload} type="file" accept="image/*" capture={facing === "user" ? "user" : "environment"} className="hidden" onChange={async (e) => { const input=e.currentTarget; const file=input.files?.[0]; try { if (file) setPhoto(await fileToDataUrl(file)); } catch { setError(L("Could not open photo", "사진을 열 수 없습니다", "无法打开照片")); } finally { input.value=""; } }} /></div>;
}
