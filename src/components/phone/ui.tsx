import type { ReactNode } from "react";
import { fileToDataUrl } from "./store";
import { IMG } from "./story";
import { PhotoImg, putPhotoImage } from "./photo-db";
import { Button } from "@/components/ui/button";

export const resolveImg = (s?: string) => (s ? (s.startsWith("img:") ? IMG[s.slice(4)] ?? "" : s) : "");

export function TopBar({ title, left, right, className = "" }: { title: ReactNode; left?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={`app-topbar ${className}`}>
      <div className="min-w-8">{left}</div>
      <div className="font-semibold truncate text-center flex-1">{title}</div>
      <div className="min-w-8 flex justify-end gap-1">{right}</div>
    </div>
  );
}

export const BackBtn = ({ onClick, label = "‹" }: { onClick: () => void; label?: string }) => (
  <Button variant="ghost" size="icon" onClick={onClick} className="text-2xl leading-none">{label}</Button>
);

export function ImageField({ value, onChange, label, large }: { value?: string | undefined; onChange: (v: string) => void; label: string; large?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {value ? <PhotoImg src={value} alt="" className="w-12 h-12 rounded-md object-cover" /> : <div className="w-12 h-12 rounded-md bg-muted" />}
      <label className="edit-chip cursor-pointer">
        {label}
        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const input = e.currentTarget;
          const f = input.files?.[0];
          try { if (f) { const data = await fileToDataUrl(f); onChange(large ? await putPhotoImage(data) : data); } }
          catch { alert("Could not open image / 이미지를 열 수 없습니다 / 无法打开图片"); }
          finally { input.value = ""; }
        }} />
      </label>
      {value && <button className="edit-chip text-destructive" onClick={() => onChange("")}>✕</button>}
    </div>
  );
}

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block text-xs text-muted-foreground">
    {label}
    <div className="mt-0.5 text-sm text-foreground">{children}</div>
  </label>
);

export function KktAvatar({ src, size = 44 }: { src?: string; size?: number }) {
  const s = resolveImg(src);
  return s ? (
    <img src={s} alt="" className="kkt-avatar object-cover" style={{ width: size, height: size }} />
  ) : (
    <div className="kkt-avatar kkt-avatar-default" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62}><circle cx="12" cy="8.5" r="4.3" fill="currentColor" /><path d="M3.5 21c.8-4.4 4.3-7 8.5-7s7.7 2.6 8.5 7z" fill="currentColor" /></svg>
    </div>
  );
}

/** Editing bar with Save / Cancel. */
export const EditBar = ({ onSave, onCancel, save, cancel }: { onSave: () => void; onCancel: () => void; save: string; cancel: string }) => (
  <div className="edit-bar">
    <Button variant="secondary" onClick={onCancel}>{cancel}</Button>
    <Button onClick={onSave}>{save}</Button>
  </div>
);
