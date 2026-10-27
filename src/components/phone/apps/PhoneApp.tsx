import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Users, Clock, Star, Grid2X2, Delete, Info } from "lucide-react";
import { tr, type AppProps } from "../i18n";
import { CONTACTS, type Contact } from "../story";
import { usePersist, uid } from "../store";
import { BackBtn, TopBar } from "../ui";
import Call from "./Call";

type Recent = { id: string; contactId: string; name: string; time: string };
export default function PhoneApp({ lang, onHome }: AppProps) {
  const [contacts] = usePersist<Contact[]>("kkt-contacts-v1", CONTACTS);
  const [recents, setRecents] = usePersist<Recent[]>("phone-call-recents-v1", []);
  const [favorites, setFavorites] = usePersist<string[]>("phone-call-favorites-v1", []);
  const [tab, setTab] = useState<"recents" | "contacts" | "keypad" | "favorites">("recents");
  const [number, setNumber] = useState("");
  const [calling, setCalling] = useState<Contact | null>(null);
  const L = (en: string, ko: string, zh: string) => tr(lang, { en, ko, zh });
  const title = tab === "recents" ? L("Recents", "최근 통화", "最近通话") : tab === "contacts" ? L("Contacts", "연락처", "通讯录") : tab === "favorites" ? L("Favorites", "즐겨찾기", "个人收藏") : L("Keypad", "키패드", "拨号键盘");
  const start = (contact: Contact) => { setCalling(contact); setRecents((current) => [{ id: uid(), contactId: contact.id, name: contact.name, time: new Date().toISOString() }, ...current]); };
  if (calling) return <Call contact={calling} lang={lang} onClose={() => setCalling(null)} />;
  return <div className="app-page phone-dialer">
    <TopBar left={<BackBtn onClick={onHome} />} title={L("Phone", "전화", "电话")} />
    <div className="flex-1 overflow-y-auto px-5">
      {tab !== "keypad" && <h1 className="system-app-title">{title}</h1>}
      {tab === "keypad" ? <div className="dialer-keypad"><div className="dialer-number">{number || " "}</div><div className="dialer-grid">{["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((digit, i) => <Button variant="secondary" key={digit} className="dialer-digit" onClick={() => setNumber((n) => n + digit)}><span>{digit}</span><small>{["", "ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ", "", "+", ""][i]}</small></Button>)}</div><div className="dialer-actions"><span /><Button size="icon" className="dialer-call" disabled={!number} aria-label={L("Simulate call", "모의 전화", "模拟拨号")} onClick={() => start({ id: `dial-${number}`, name: number, avatar: "", status: "", unread: 0 })}><Phone /></Button><Button variant="ghost" size="icon" aria-label={L("Delete digit", "숫자 삭제", "删除数字")} onClick={() => setNumber((n) => n.slice(0, -1))}><Delete /></Button></div></div>
      : tab === "recents" ? recents.map((recent) => <Button key={recent.id} variant="ghost" className="phone-contact-row" onClick={() => start(contacts.find((c) => c.id === recent.contactId) ?? { id: recent.contactId, name: recent.name, avatar: "", status: "", unread: 0 })}><Phone /><span className="flex-1 text-left"><b className="block">{recent.name}</b><small className="text-muted-foreground">{L("Simulated outgoing", "모의 발신", "模拟呼出")}</small></span><small>{new Date(recent.time).toLocaleTimeString(lang === "zh" ? "zh-CN" : lang === "ko" ? "ko-KR" : "en-US", { hour: "2-digit", minute: "2-digit" })}</small><Info /></Button>)
      : contacts.filter((c) => tab === "contacts" || favorites.includes(c.id)).map((c) => <div className="phone-contact-row" key={c.id}><Button variant="ghost" className="flex-1 justify-start" onClick={() => start(c)}>{c.name}</Button><Button variant="ghost" size="icon" aria-label={L("Favorite contact", "즐겨찾기 연락처", "收藏联系人")} aria-pressed={favorites.includes(c.id)} onClick={() => setFavorites((current) => current.includes(c.id) ? current.filter((id) => id !== c.id) : [...current, c.id])}><Star className={favorites.includes(c.id) ? "fill-primary text-primary" : ""} /></Button></div>)}
      {tab === "recents" && !recents.length && <p className="text-muted-foreground text-center py-16">{L("No recent calls", "최근 통화 없음", "暂无最近通话")}</p>}
    </div>
    <nav className="system-app-tabs">{([{ id: "favorites", icon: <Star />, name: L("Favorites", "즐겨찾기", "收藏") }, { id: "recents", icon: <Clock />, name: L("Recents", "최근 통화", "最近") }, { id: "contacts", icon: <Users />, name: L("Contacts", "연락처", "通讯录") }, { id: "keypad", icon: <Grid2X2 />, name: L("Keypad", "키패드", "拨号") }] as const).map((item) => <Button variant="ghost" key={item.id} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>{item.icon}<span>{item.name}</span></Button>)}</nav>
  </div>;
}