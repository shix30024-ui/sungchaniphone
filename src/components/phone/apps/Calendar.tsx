import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { tr, type AppProps } from "../i18n";
import { label, localeFor, confirmDelete } from "../labels";
import { STORY_DATE } from "../chronology";
import { monthCells, type CalendarEvent } from "../organizer";
import { usePersist, uid } from "../store";
import { BackBtn, TopBar, Field, EditBar } from "../ui";

export default function Calendar({ lang, onHome }: AppProps) {
  const [events, setEvents] = usePersist<CalendarEvent[]>("calendar-events-v1", []);
  const [month, setMonth] = useState(new Date(STORY_DATE + "T12:00:00"));
  const [date, setDate] = useState(STORY_DATE);
  const [draft, setDraft] = useState<CalendarEvent | null>(null);
  const [query, setQuery] = useState<string | null>(null);
  useEffect(() => { const today = new Date(); setMonth(today); setDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`); }, []);
  if (draft) return <div className="app-page bg-background">
    <TopBar title={label(lang, "event")} />
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {(["title", "date", "time", "note"] as const).map((key) => <Field key={key} label={label(lang, key)}><input className="sheet-input" type={key === "date" || key === "time" ? key : "text"} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} /></Field>)}
      {events.some((event) => event.id === draft.id) && <Button variant="destructive" onClick={() => { if (confirmDelete(lang)) { setEvents(events.filter((e) => e.id !== draft.id)); setDraft(null); } }}><Trash2 />{label(lang, "delete")}</Button>}
    </div>
    <EditBar save={label(lang, "save")} cancel={label(lang, "cancel")} onCancel={() => setDraft(null)} onSave={() => { if (!draft.title.trim() || !draft.date) return; setEvents(events.some((e) => e.id === draft.id) ? events.map((e) => e.id === draft.id ? draft : e) : [...events, draft]); setDate(draft.date); setMonth(new Date(draft.date + "T12:00:00")); setDraft(null); }} />
  </div>;
  const changeMonth = (delta: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  return <div className="app-page bg-background calendar-native">
    <TopBar left={<BackBtn onClick={onHome} />} title={label(lang, "calendar")} right={<Button variant="ghost" size="icon" aria-label={label(lang, "add")} onClick={() => setDraft({ id: uid(), title: "", date, time: "12:00", note: "" })}><Plus /></Button>} />
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-3"><Button variant="ghost" size="icon" aria-label="‹" onClick={() => changeMonth(-1)}><ChevronLeft /></Button><b className="calendar-month">{month.toLocaleDateString(localeFor(lang), { year: "numeric", month: "long" })}</b><Button variant="ghost" size="icon" aria-label="›" onClick={() => changeMonth(1)}><ChevronRight /></Button></div>
      {query !== null && <input className="sheet-input mb-4" aria-label={label(lang, "search")} placeholder={label(lang, "search")} value={query} onChange={(e) => setQuery(e.target.value)} />}
      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: 7 }, (_, i) => <span key={i} className="text-xs text-muted-foreground">{new Date(2026, 9, 25 + i).toLocaleDateString(localeFor(lang), { weekday: "short" })}</span>)}
        {monthCells(month.getFullYear(), month.getMonth()).map((day, i) => {
          const value = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day ?? 1).padStart(2, "0")}`;
          return day === null ? <span key={i} /> : <Button key={i} variant="ghost" aria-pressed={date === value} className="calendar-day h-11 p-0 flex-col gap-0" onClick={() => setDate(value)}>{day}<span className="h-1 text-xs leading-none">{events.some((e) => e.date === value) ? "•" : ""}</span></Button>;
        })}
      </div>
      <h2 className="font-semibold mt-6 mb-2">{date}</h2>
      {events.filter((e) => query ? `${e.title} ${e.note}`.toLowerCase().includes(query.toLowerCase()) : e.date === date).sort((a, b) => a.time.localeCompare(b.time)).map((event) => <Button key={event.id} variant="ghost" className="w-full h-auto justify-start text-left py-3 border-b whitespace-normal" onClick={() => setDraft({ ...event })}><span className="text-muted-foreground">{event.time}</span><span><b className="block">{event.title}</b>{event.note}</span></Button>)}
      {!events.some((e) => e.date === date) && <p className="text-sm text-muted-foreground">{label(lang, "empty")}</p>}
    </div>
    <nav className="calendar-bottom"><Button variant="ghost" onClick={() => { const today = new Date(); setMonth(today); setDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`); }}>{tr(lang, { en: "Today", ko: "오늘", zh: "今天" })}</Button><Button variant="ghost" onClick={() => setQuery(query === null ? "" : null)}>{label(lang, "search")}</Button></nav>
  </div>;
}