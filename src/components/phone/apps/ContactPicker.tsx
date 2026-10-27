import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, UserRound } from "lucide-react";
import { type AppProps, tr } from "../i18n";
import { usePersist } from "../store";
import { CONTACTS, type Contact } from "../story";
import { DEVICE_CONTACTS_KEY, mergeDeviceContacts, type DeviceContact } from "../contacts";
import { TopBar, resolveImg } from "../ui";
export default function ContactPicker({ lang, onHome, select }: AppProps & { select: (contact: DeviceContact) => void }) {
 const [legacy] = usePersist<Contact[]>("kkt-contacts-v1", CONTACTS);
 const [edits] = usePersist<DeviceContact[]>(DEVICE_CONTACTS_KEY, []);
 const [search,setSearch] = useState("");
 const contacts = mergeDeviceContacts(legacy,edits);
 return <div className="app-page bg-background"><TopBar title={tr(lang,{en:"Contacts",ko:"연락처",zh:"联系人"})} left={<Button variant="ghost" onClick={onHome}>{tr(lang,{en:"Cancel",ko:"취소",zh:"取消"})}</Button>}/><div className="flex-1 overflow-y-auto p-4"><div className="native-search"><Search size={17}/><input aria-label={tr(lang,{en:"Search contacts",ko:"연락처 검색",zh:"搜索联系人"})} placeholder={tr(lang,{en:"Search",ko:"검색",zh:"搜索"})} value={search} onChange={(e)=>setSearch(e.target.value)}/></div>{contacts.filter((c)=>`${c.name} ${c.number ?? ""}`.toLowerCase().includes(search.toLowerCase())).map((c)=><Button variant="ghost" className="phone-contact-row" key={c.id} onClick={()=>select(c)}><span className="sms-avatar">{c.avatar ? <img src={resolveImg(c.avatar)} alt=""/> : <UserRound size={25}/>}</span><span className="flex-1 text-left"><b className="block">{c.name}</b><small className="text-muted-foreground">{c.number}</small></span></Button>)}</div></div>;
}
