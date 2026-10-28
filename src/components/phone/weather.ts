import type { Lang } from "./i18n";
export const WEATHER_CITY_KEY = "phone-weather-city-v1";
export type WeatherCity = { name: string; latitude: number; longitude: number };
export const SEOUL: WeatherCity = { name: "Seoul", latitude: 37.5665, longitude: 126.978 };
export type Forecast = {
  current: { time: string; temperature_2m: number; apparent_temperature: number; weather_code: number; relative_humidity_2m: number; wind_speed_10m: number };
  hourly: { time: string[]; temperature_2m: number[]; weather_code: number[]; precipitation_probability: number[] };
  daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; weather_code: number[] };
};
export function forecastUrl(city: WeatherCity) {
  const params = new URLSearchParams({ latitude: String(city.latitude), longitude: String(city.longitude), current: "temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m", hourly: "temperature_2m,weather_code,precipitation_probability", daily: "weather_code,temperature_2m_max,temperature_2m_min", timezone: "auto", forecast_days: "7" });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}
export function weatherKind(code: number) {
  if (code === 0) return "clear";
  if (code <= 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if ([71,73,75,77,85,86].includes(code)) return "snow";
  if (code >= 95) return "storm";
  return "rain";
}
export function weatherLabel(code: number, lang: Lang) {
  const names = { clear: { en: "Clear", ko: "맑음", zh: "晴" }, cloud: { en: "Cloudy", ko: "흐림", zh: "多云" }, fog: { en: "Fog", ko: "안개", zh: "雾" }, snow: { en: "Snow", ko: "눈", zh: "雪" }, storm: { en: "Thunderstorms", ko: "뇌우", zh: "雷雨" }, rain: { en: "Rain", ko: "비", zh: "雨" } };
  return names[weatherKind(code)][lang];
}