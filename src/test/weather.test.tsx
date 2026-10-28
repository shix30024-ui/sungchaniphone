import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Weather from "@/components/phone/apps/Weather";
import { DEFAULT_APPS, loadApps } from "@/components/phone/apps";
import { forecastUrl, SEOUL, WEATHER_CITY_KEY } from "@/components/phone/weather";
const forecast = {
  current: { time: "2026-10-28T12:00", temperature_2m: 18, apparent_temperature: 17, weather_code: 0, relative_humidity_2m: 40, wind_speed_10m: 8 },
  hourly: { time: ["2026-10-28T12:00"], temperature_2m: [18], weather_code: [0], precipitation_probability: [0] },
  daily: { time: ["2026-10-28"], temperature_2m_max: [20], temperature_2m_min: [11], weather_code: [0] },
};
describe("Weather preservation", () => {
  beforeEach(() => { cleanup(); localStorage.clear(); });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
  it("adds only Weather once to customized icons without reseeding a deleted icon", () => {
    const saved = DEFAULT_APPS.filter((app) => app.id !== "weather").map((app) => ({ ...app, name: `Saved ${app.name}` })).reverse();
    localStorage.setItem("phone-apps-v2", JSON.stringify(saved));
    localStorage.setItem("phone-calendar-added-v1", "true");
    const result = loadApps();
    expect(result.slice(0,-1)).toEqual(saved);
    expect(result.at(-1)?.id).toBe("weather");
    localStorage.setItem("phone-apps-v2", JSON.stringify(saved));
    expect(loadApps()).toEqual(saved);
  });
  it("uses real service coordinates and never stores forecast readings or unrelated app data", async () => {
    localStorage.setItem("kkt-msgs-v1", "manual content");
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => forecast });
    vi.stubGlobal("fetch", fetcher);
    const ui = render(<Weather lang="en" onHome={() => {}} />);
    expect(await screen.findByText("Clear")).toBeInTheDocument();
    expect(fetcher.mock.calls[0]?.[0]).toBe(forecastUrl(SEOUL));
    expect(localStorage.getItem(WEATHER_CITY_KEY)).toBeNull();
    expect(localStorage.getItem("kkt-msgs-v1")).toBe("manual content");
    ui.rerender(<Weather lang="zh" onHome={() => {}} />);
    expect(screen.getByText("晴")).toBeInTheDocument();
    expect(screen.getByText("首尔")).toBeInTheDocument();
  });
  it("shows an honest service error and can retry without invented temperatures", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ ok: true, json: async () => forecast });
    vi.stubGlobal("fetch", fetcher);
    render(<Weather lang="en" onHome={() => {}} />);
    expect(await screen.findByText("Weather unavailable")).toBeInTheDocument();
    expect(screen.getByText("—°")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Clear")).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});