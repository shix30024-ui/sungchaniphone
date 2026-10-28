import { useEffect, useState } from "react";
import { Cloud, CloudFog, CloudLightning, CloudRain, Snowflake, Sun, Search, RefreshCw, ChevronLeft, Droplets, Wind, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type AppProps, tr } from "../i18n";
import { localeFor } from "../labels";
import { usePersist } from "../store";
import { SEOUL, WEATHER_CITY_KEY, forecastUrl, weatherKind, weatherLabel, type WeatherCity, type Forecast } from "../weather";

function WeatherIcon({ code, size = 24 }: { code: number; size?: number }) {
  const Icon = { clear: Sun, cloud: Cloud, fog: CloudFog, rain: CloudRain, snow: Snowflake, storm: CloudLightning }[weatherKind(code)];
  return <Icon size={size} aria-hidden="true" />;
}
export default function Weather({ lang, onHome }: AppProps) {
  const [city, setCity] = usePersist<WeatherCity>(WEATHER_CITY_KEY, SEOUL);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WeatherCity[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const L = (en: string, ko: string, zh: string) => tr(lang, { en, ko, zh });
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    let active = true;
    setLoading(true); setForecast(null); setError(false);
    fetch(forecastUrl(city), { signal: controller.signal }).then(async (r) => {
      if (!r.ok) throw new Error("weather unavailable");
      const data: Forecast = await r.json();
      if (!data.current || !data.daily || !data.hourly) throw new Error("invalid forecast");
      if (active) setForecast(data);
    }).catch(() => { if (active) setError(true); }).finally(() => { clearTimeout(timer); if (active) setLoading(false); });
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [city.latitude, city.longitude, reload]);
  const name = city.name === "Seoul" ? L("Seoul", "서울", "首尔") : city.name;
  const hours = forecast?.hourly.time.map((time, i) => ({ time, i })).filter(({ time }) => time >= new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0,13).replace(" ", "T")).slice(0,12) ?? [];
  return <div className="app-page weather-native">
    <header className="weather-toolbar"><Button variant="ghost" size="icon" aria-label={L("Back", "뒤로", "返回")} onClick={onHome}><ChevronLeft /></Button><span>{L("Weather", "날씨", "天气")}</span><Button variant="ghost" size="icon" aria-label={L("Search city", "도시 검색", "搜索城市")} onClick={() => setSearching(!searching)}><Search /></Button><Button variant="ghost" size="icon" aria-label={L("Refresh", "새로고침", "刷新")} onClick={() => setReload((n) => n + 1)}><RefreshCw /></Button></header>
    {searching && <section className="weather-search"><form onSubmit={async (e) => {
      e.preventDefault(); if (!query.trim()) return;
      setSearchBusy(true); setSearchError(false); setResults([]);
      try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=5&language=${lang}`, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error("search unavailable");
        const data = await response.json() as { results?: WeatherCity[] };
        setResults(data.results ?? []);
      } catch { setSearchError(true); } finally { setSearchBusy(false); }
    }}><input aria-label={L("City", "도시", "城市")} placeholder={L("City", "도시", "城市")} value={query} onChange={(e) => setQuery(e.target.value)} /><Button type="submit" variant="ghost" size="icon" disabled={searchBusy} aria-label={L("Search", "검색", "搜索")}><Search /></Button></form>{results.map((c) => <Button key={`${c.latitude}-${c.longitude}`} variant="ghost" className="w-full justify-start" onClick={() => { setCity({ name: c.name, latitude: c.latitude, longitude: c.longitude }); setSearching(false); }}>{c.name}</Button>)}{searchError && <p role="alert">{L("City search unavailable", "도시 검색을 사용할 수 없습니다", "城市搜索暂不可用")}</p>}</section>}
    <div className="weather-scroll"><section className="weather-current"><h1>{name}</h1>{forecast ? <><strong>{Math.round(forecast.current.temperature_2m)}°</strong><WeatherIcon code={forecast.current.weather_code} size={40} /><p>{weatherLabel(forecast.current.weather_code, lang)}</p><p>{L("H", "최고", "最高")}: {Math.round(forecast.daily.temperature_2m_max[0] ?? 0)}° · {L("L", "최저", "最低")}: {Math.round(forecast.daily.temperature_2m_min[0] ?? 0)}°</p></> : <><strong>—°</strong><p role="status">{loading ? L("Loading weather…", "날씨 불러오는 중…", "正在获取天气…") : L("Weather unavailable", "날씨를 불러올 수 없습니다", "天气暂不可用")}</p>{error && <Button variant="secondary" onClick={() => setReload((n) => n + 1)}>{L("Try again", "다시 시도", "重试")}</Button>}</>}</section>
      {forecast && <><section className="weather-section"><h2>{L("Hourly forecast", "시간별 예보", "逐小时预报")}</h2><div className="weather-hours">{hours.map(({ time, i }) => <div key={time}><span>{time.slice(11,13)}:00</span><WeatherIcon code={forecast.hourly.weather_code[i] ?? 0} /><b>{Math.round(forecast.hourly.temperature_2m[i] ?? 0)}°</b></div>)}</div></section><section className="weather-section"><h2>{L("7-day forecast", "7일 예보", "7 日天气预报")}</h2>{forecast.daily.time.map((day, i) => <div className="weather-day" key={day}><span>{i === 0 ? L("Today", "오늘", "今天") : new Date(`${day}T12:00:00`).toLocaleDateString(localeFor(lang), { weekday: "short" })}</span><WeatherIcon code={forecast.daily.weather_code[i] ?? 0} /><span>{Math.round(forecast.daily.temperature_2m_min[i] ?? 0)}°</span><b>{Math.round(forecast.daily.temperature_2m_max[i] ?? 0)}°</b></div>)}</section><section className="weather-metrics"><div><Thermometer /><span>{L("Feels like", "체감 온도", "体感温度")}</span><b>{Math.round(forecast.current.apparent_temperature)}°</b></div><div><Droplets /><span>{L("Humidity", "습도", "湿度")}</span><b>{forecast.current.relative_humidity_2m}%</b></div><div><Wind /><span>{L("Wind", "바람", "风速")}</span><b>{forecast.current.wind_speed_10m} km/h</b></div></section><p className="weather-source">Open-Meteo</p></>}
    </div>
  </div>;
}