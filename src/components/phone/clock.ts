import { useEffect, useState } from "react";
export const localClock = (date: Date) => `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
export function useDeviceNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const refresh = () => setNow(new Date());
    refresh();
    const timer = setInterval(refresh, 1000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  return now;
}