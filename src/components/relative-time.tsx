"use client";

import { useEffect, useState } from "react";

export function useMinuteNow() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let interval: number | undefined;
    const update = () => setNow(Date.now());
    const initial = window.setTimeout(() => {
      update();
      interval = window.setInterval(update, 60_000);
    }, 0);
    return () => {
      window.clearTimeout(initial);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, []);

  return now;
}

export function relativeMinutes(from: string | null | undefined, now: number | null, minOne = false) {
  if (!from || now === null) return null;
  const timestamp = new Date(from).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(minOne ? 1 : 0, Math.floor((now - timestamp) / 60_000));
}

export function formatRelativeMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} h ${remainder} min`;
}

export function RelativeTime({
  from,
  now,
  minOne = false,
  placeholder = "--",
}: {
  from: string | null | undefined;
  now: number | null;
  minOne?: boolean;
  placeholder?: string;
}) {
  const minutes = relativeMinutes(from, now, minOne);
  return <>{minutes === null ? placeholder : formatRelativeMinutes(minutes)}</>;
}
