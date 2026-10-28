import { Button } from "@/components/ui/button";
import { Info, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";
import { KktAvatar } from "../ui";
import { tr, type Lang } from "../i18n";
import { PRESET_CALLS } from "../native-presets";
import { localeFor } from "../labels";
import { orderCalls, type RecentCall, type DeviceContact } from "../contacts";

export default function CallRows({ calls, contacts, lang, editMode, onDetail, onEdit, onCall }: { calls: RecentCall[]; contacts: DeviceContact[]; lang: Lang; editMode: boolean; onDetail: (c: DeviceContact) => void; onEdit: (r: RecentCall) => void; onCall: (c: DeviceContact) => void }) {
  if (!calls.length) return <p className="native-empty">{tr(lang, { en: "No recent calls", ko: "최근 통화 없음", zh: "暂无最近通话" })}</p>;
  return orderCalls(calls).map((record) => {
    const contact = contacts.find((c) => c.id === record.contactId) ?? { id: record.contactId, name: record.name, avatar: "", status: "", unread: 0 };
    const preset = PRESET_CALLS.find((r)=>r.id===record.id);
    const displayName = preset && record.name === preset.name ? contact.name : record.name;
    const Icon = record.direction === "missed" ? PhoneMissed : record.direction === "incoming" ? PhoneIncoming : PhoneOutgoing;
    const direction = tr(lang, record.direction === "missed" ? { en: "Missed call", ko: "부재중 전화", zh: "未接来电" } : record.direction === "incoming" ? { en: "Incoming call", ko: "수신 전화", zh: "呼入电话" } : { en: "Outgoing call", ko: "발신 전화", zh: "呼出电话" });
    return <div key={record.id} className="phone-contact-row">
      <Button variant="ghost" className="flex-1 justify-start min-w-0 h-auto" onClick={() => editMode ? onEdit(record) : onDetail(contact)}>
        <KktAvatar src={contact.avatar} size={35} />
        <span className="flex-1 text-left min-w-0"><b className={`block truncate ${record.direction === "missed" ? "text-destructive" : ""}`}>{displayName}</b><small className="text-muted-foreground flex items-center gap-1"><Icon size={12} />{direction}{record.duration !== undefined && ` · ${Math.floor(record.duration/60)}:${String(record.duration%60).padStart(2,"0")}`}</small></span>
        <small>{new Date(record.time).toLocaleString(localeFor(lang), { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}</small>
      </Button>
      <Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Simulate call", ko: "모의 전화", zh: "模拟拨号" })} onClick={() => onCall(contact)}><Phone size={17} /></Button>
      <Button variant="ghost" size="icon" aria-label={tr(lang, editMode ? { en: "Edit call record", ko: "통화 기록 편집", zh: "编辑通话记录" } : { en: "Call details", ko: "통화 상세", zh: "通话详情" })} onClick={() => editMode ? onEdit(record) : onDetail(contact)}><Info size={18} /></Button>
    </div>;
  });
}