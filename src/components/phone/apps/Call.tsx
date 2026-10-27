import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone, PhoneOff, ArrowLeft } from "lucide-react";
import { tr, type Lang } from "../i18n";
import type { Contact } from "../story";
import { KktAvatar } from "../ui";

export default function Call({ contact, lang, incoming = false, onClose }: { contact: Contact; lang: Lang; incoming?: boolean; onClose: () => void }) {
  const [state, setState] = useState<"calling" | "ringing" | "connected" | "ended">(incoming ? "ringing" : "calling");
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (incoming || state === "ended" || state === "connected") return;
    const timer = setTimeout(() => setState((s) => s === "calling" ? "ringing" : "connected"), state === "calling" ? 1200 : 2200);
    return () => clearTimeout(timer);
  }, [state, incoming]);
  useEffect(() => {
    if (state !== "connected") return;
    const timer = setInterval(() => setSeconds((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [state]);
  const status = state === "calling" ? { en: "Calling…", ko: "연결 중…", zh: "正在呼叫…" } : state === "ringing" ? { en: incoming ? "Incoming call" : "Ringing…", ko: incoming ? "전화 수신" : "응답 대기 중…", zh: incoming ? "来电" : "等待接听…" } : state === "ended" ? { en: "Call ended", ko: "통화 종료", zh: "通话结束" } : null;
  return <div className="app-page call-screen">
    <div className="px-4"><Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Back to chat", ko: "채팅으로 돌아가기", zh: "返回聊天" })} onClick={onClose}><ArrowLeft /></Button></div>
    <div className="flex flex-1 flex-col items-center pt-12 gap-5">
      <KktAvatar src={contact.avatar} size={90} /><h2 className="text-2xl font-semibold text-center px-4">{contact.name}</h2>
      <span className="text-xs opacity-60">{tr(lang, { en: "Simulated call", ko: "모의 통화", zh: "模拟通话" })}</span>
      <div role="status" className="text-lg tabular-nums">{status ? tr(lang, status) : `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`}</div>
    </div>
    <div className="flex justify-center gap-8 pb-14">
      {state === "connected" && <Button variant="secondary" size="icon" className="call-control" aria-label={tr(lang, { en: "Mute", ko: "음소거", zh: "静音" })} aria-pressed={muted} onClick={() => setMuted(!muted)}>{muted ? <MicOff /> : <Mic />}</Button>}
      {incoming && state === "ringing" && <Button size="icon" className="call-control call-answer" aria-label={tr(lang, { en: "Answer", ko: "받기", zh: "接听" })} onClick={() => setState("connected")}><Phone /></Button>}
      <Button variant={state === "ended" ? "secondary" : "destructive"} size="icon" className="call-control" aria-label={tr(lang, state === "ended" ? { en: "Back", ko: "뒤로", zh: "返回" } : { en: "Hang up", ko: "종료", zh: "挂断" })} onClick={() => state === "ended" ? onClose() : setState("ended")}>{state === "ended" ? <ArrowLeft /> : <PhoneOff />}</Button>
    </div>
  </div>;
}