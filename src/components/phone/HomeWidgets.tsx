import { Button } from "@/components/ui/button";
import { CalendarDays, Image } from "lucide-react";
import { type Lang, tr } from "./i18n";
import { ALBUMS, type Album } from "./story";
import { type CalendarEvent } from "./organizer";
import { usePersist } from "./store";
import { resolveImg } from "./ui";
import { localeFor } from "./labels";
export default function HomeWidgets({ lang, now, openApp }: { lang: Lang; now: Date | null; openApp: (id: string) => void }) {
 const [albums] = usePersist<Album[]>("photos-v1", ALBUMS);
 const [events] = usePersist<CalendarEvent[]>("calendar-events-v1", []);
 const photo = albums.flatMap((a) => a.photos).at(-1);
 const date = now ? `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}` : "";
 const today = events.filter((e) => e.date === date);
 return <div className="home-widgets"><Button variant="ghost" className="home-calendar-widget" aria-label={tr(lang,{en:"Calendar widget",ko:"캘린더 위젯",zh:"日历小组件"})} onClick={() => openApp("calendar")}><span className="widget-weekday">{now?.toLocaleDateString(localeFor(lang),{weekday:"long"}) ?? ""}</span><strong>{now?.getDate() ?? ""}</strong><div className="widget-event-list">{today.length ? today.slice(0,2).map((e) => <span key={e.id}><b>{e.title}</b><small>{e.time}</small></span>) : <span className="widget-no-events"><CalendarDays size={15}/>{tr(lang,{en:"No events today",ko:"오늘 일정 없음",zh:"今天没有日程"})}</span>}</div></Button><Button variant="ghost" className="home-photo-widget" aria-label={tr(lang,{en:"Photos widget",ko:"사진 위젯",zh:"照片小组件"})} onClick={() => openApp("photos")}>{photo ? <img src={resolveImg(photo.image)} alt="" /> : <Image size={32}/>}<span>{tr(lang,{en:"Photos",ko:"사진",zh:"照片"})}</span></Button></div>;
}
