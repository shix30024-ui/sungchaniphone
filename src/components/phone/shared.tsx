import { useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { saveSharedPhone } from "@/lib/phone-sharing.functions";
import { Button } from "@/components/ui/button";
import { SHARED_KEYS, authoredValue, shouldShareExistingContent } from "./shared-policy";
import { installShared, isSharedOwner, setSharedOwner, setSharedSave, sharedRevision, advanceSharedRevision, clearSharedRevision } from "./shared-state";
import { listPhotoImages, putKv } from "./photo-db";
import { type Lang, tr } from "./i18n";

const EVENT = "phone-sharing-status";
let status = "";
let busy = false;
let pending: Record<string, unknown> = {};
let sending = false;
let lastError = false;
let conflicted = false;
const notify = (message: string, error = false) => { status = message; lastError = error; window.dispatchEvent(new Event(EVENT)); };
function subscribe(fn: () => void) { window.addEventListener(EVENT, fn); return () => window.removeEventListener(EVENT, fn); }
export function useSharingStatus() { return useSyncExternalStore(subscribe, () => status, () => ""); }

async function publishMedia(value: unknown, images: Record<string, string>): Promise<unknown> {
  if (Array.isArray(value)) return Promise.all(value.map((v) => publishMedia(v, images)));
  if (value && typeof value === "object") return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([k, v]) => [k, await publishMedia(v, images)])));
  if (typeof value === "string" && value.startsWith("https://")) {
    const url = new URL(value);
    const marker = "/storage/v1/object/sign/phone-shared-media/";
    if (url.pathname.includes(marker)) return `shared-media:${decodeURIComponent(url.pathname.split(marker)[1] ?? "")}`;
  }
  if (typeof value !== "string" || (!value.startsWith("idb:") && !value.startsWith("data:image/"))) return value;
  const data = value.startsWith("idb:") ? images[value.slice(4)] : value;
  // A missing local photo must not block every other chat, post and photo from being shared.
  if (!data) return value;
  const blob = await (await fetch(data)).blob();
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()))).map((v) => v.toString(16).padStart(2, "0")).join("");
  const path = `${hash}.${blob.type === "image/png" ? "png" : "jpg"}`;
  const { error } = await supabase.storage.from("phone-shared-media").upload(path, blob, { contentType: blob.type, upsert: false });
  if (error && !/already exists|duplicate/i.test(error.message)) throw error;
  return `shared-media:${path}`;
}

async function flush() {
  if (sending || !isSharedOwner() || !Object.keys(pending).length) return;
  if (conflicted) { notify("Another device changed the shared content. Your edits remain on this device; download a backup before resolving the conflict. / 其他设备已更改内容，你的修改仍保留在此设备，请先下载备份", true); return; }
  sending = true; busy = true; notify("Saving for everyone… / 모두에게 저장 중… / 正在保存给所有人…");
  const patch = pending; pending = {};
  try {
    const published = await publishMedia(patch, await listPhotoImages());
    const version = await saveSharedPhone({ data: { patch: published, revision: sharedRevision() } });
    // The owner's original local records stay untouched, including their idb references.
    advanceSharedRevision(version);
    notify("Saved for everyone / 모두에게 저장됨 / 已保存，所有人可见");
  } catch (e) {
    pending = { ...patch, ...pending };
    conflicted = e instanceof Error && /changed on another device/i.test(e.message);
    notify(`Not shared yet — ${e instanceof Error ? e.message : "Save failed"} / 尚未共享，请重试`, true);
  } finally { sending = false; busy = false; if (!lastError && Object.keys(pending).length) void flush(); }
}

export async function shareExistingContent() {
  if (!isSharedOwner() || busy) return;
  const records: Record<string, unknown> = {};
  for (const key of SHARED_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    try { records[key] = JSON.parse(raw); } catch { /* unreadable record stays local and untouched */ }
  }
  if (!Object.keys(records).length) throw new Error("No saved content in this browser / 此浏览器里没有找到已保存的内容");
  try { await putKv(`phone-before-sharing-${Date.now()}`, JSON.stringify(records)); } catch { /* snapshot is best-effort; originals are never modified */ }
  pending = { ...pending, ...Object.fromEntries(Object.entries(records).map(([k, v]) => [k, authoredValue(v)])) };
  await flush();
}

export function useSharedPhone() {
  useEffect(() => {
    let live = true;
    let refreshing = false;
    const refresh = async () => {
      if (refreshing || sending || (isSharedOwner() && Object.keys(pending).length)) return;
      refreshing = true;
      try {
      const { data: role } = await supabase.rpc("is_phone_owner");
      if (!live) return;
      if (isSharedOwner() !== (role === true)) clearSharedRevision();
      setSharedOwner(role === true);
      window.dispatchEvent(new CustomEvent("phone-store", { detail: "phone-owner-v1" }));
      const { data, error } = await supabase.from("phone_shared_content").select("payload,revision").eq("id", "main").maybeSingle();
      if (!live) return;
      if (error) { notify("Shared content unavailable; saved local content is unchanged. / 共享读取失败，原内容未改动", true); return; }
      // Retry on every poll until the first shared copy exists, so a transient failure never leaves visitors empty.
      if (shouldShareExistingContent(role === true, !!data, Object.keys(localStorage))) {
        try { await shareExistingContent(); }
        catch (e) { notify(`Not shared yet — ${e instanceof Error ? e.message : "Save failed"} / 尚未共享，将自动重试`, true); }
        return;
      }
      if (data && data.revision !== sharedRevision()) {
        const resolve = async (value: unknown): Promise<unknown> => {
          if (Array.isArray(value)) return Promise.all(value.map(resolve));
          if (value && typeof value === "object") return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([k, v]) => [k, await resolve(v)])));
          if (typeof value === "string" && value.startsWith("shared-media:")) {
            const { data: url, error: mediaError } = await supabase.storage.from("phone-shared-media").createSignedUrl(value.slice(13), 86400);
            if (mediaError) throw mediaError;
            return url.signedUrl;
          }
          return value;
        };
        try { const payload = await resolve(data.payload); if (live) installShared(payload as Record<string, unknown>, data.revision); }
        catch { notify("Some shared photos could not load. / 部分共享照片读取失败", true); }
      }
      window.dispatchEvent(new Event(EVENT));
      } finally { refreshing = false; }
    };
    setSharedSave((key, value) => { pending[key] = authoredValue(value); void flush(); });
    void refresh().catch(() => notify("Shared content could not load. Original data is unchanged. / 共享读取失败，原内容未改动", true));
    const reload = () => { void refresh().catch(() => notify("Shared content could not load. / 共享读取失败", true)); };
    const { data: auth } = supabase.auth.onAuthStateChange((event) => { if (["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) setTimeout(reload, 0); });
    const timer = setInterval(() => { if (!sending && document.visibilityState === "visible") reload(); }, 10000);
    return () => { live = false; auth.subscription.unsubscribe(); clearInterval(timer); setSharedSave(undefined); };
  }, []);
}

export function SharedControls({ lang }: { lang: Lang }) {
  useSharingStatus();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [waiting, setWaiting] = useState(false);
  const L = (en: string, ko: string, zh: string) => tr(lang, { en, ko, zh });
  const action = async (fn: () => Promise<unknown>) => { setWaiting(true); setMessage(""); try { await fn(); } catch (e) { setMessage(e instanceof Error ? e.message : "Failed"); } finally { setWaiting(false); } };
  const signIn = async (register: boolean) => {
    const result = register ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }) : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) throw result.error;
    if (register && !result.data.session) setMessage(L("Check your email to confirm your account", "이메일에서 계정을 확인하세요", "请到邮箱点击确认链接，然后登录"));
    else {
      const { data: role } = await supabase.rpc("is_phone_owner");
      if (!role) setMessage(L("This account is not the phone owner", "이 계정은 폰 주인이 아닙니다", "此账号不是主人账号，不能编辑共享内容"));
    }
  };
  return <div className="settings-group">
    {isSharedOwner() ? <>
      <div className="settings-row"><span className="settings-row-name">{L("Owner signed in", "주인 로그인됨", "主人已登录")}</span></div>
      <Button variant="ghost" className="settings-row" disabled={waiting || busy} onClick={() => { if (window.confirm(L("Share the saved chats, posts and photos from this browser with everyone? Original data is kept.", "이 브라우저의 저장된 콘텐츠를 모두에게 공유할까요? 원본은 유지됩니다.", "把此预览中保存的聊天、帖子和照片共享给所有人？原数据会保留。"))) void action(shareExistingContent); }}><span className="settings-row-name text-primary">{L("Share my saved content", "저장한 콘텐츠 공유", "将我已改好的内容共享给所有人")}</span></Button>
      <Button variant="ghost" className="settings-row" onClick={() => { void action(flush); }}><span className="settings-row-name">{L("Retry sharing", "다시 저장", "重试共享保存")}</span></Button>
      <Button variant="ghost" className="settings-row" onClick={() => { void action(async () => { if (sending || Object.keys(pending).length) throw new Error(L("Unsynced edits remain. Save or download a backup before signing out.", "저장되지 않은 편집이 있습니다", "还有未共享的修改，请先保存或下载备份再退出")); await supabase.auth.signOut(); }); }}><span className="settings-row-name">{L("Sign out", "로그아웃", "退出主人账号")}</span></Button>
    </> : <>
      <label className="flex flex-col gap-2 px-4 py-3"><span className="text-sm">{L("Owner email", "주인 이메일", "主人邮箱")}</span><input className="sheet-input min-w-0 w-full" aria-label="Owner email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="flex flex-col gap-2 px-4 py-3"><span className="text-sm">{L("Password", "비밀번호", "账号密码")}</span><input className="sheet-input min-w-0 w-full" aria-label="Account password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <Button variant="ghost" className="settings-row" disabled={waiting} onClick={() => { void action(() => signIn(false)); }}>{L("Sign in", "로그인", "登录主人账号")}</Button>
      <Button variant="ghost" className="settings-row" disabled={waiting} onClick={() => { void action(() => signIn(true)); }}>{L("Create account", "계정 만들기", "首次创建账号")}</Button>
      {(["google", "lovable"] as const).map((provider) => <Button key={provider} variant="ghost" className="settings-row" disabled={waiting} onClick={() => { void action(async () => { const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin }); if (result.error) throw result.error; }); }}>{provider === "google" ? "Google" : "Lovable"}</Button>)}
    </>}
    {(message || status) && <div className="settings-row" role={message || lastError ? "alert" : "status"}><span className="settings-row-name">{message || status}</span></div>}
  </div>;
}