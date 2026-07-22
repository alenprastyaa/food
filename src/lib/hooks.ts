"use client";
import { useEffect, useRef, useState, useCallback } from "react";

/** poll a JSON endpoint on an interval */
export function usePoll<T>(url: string | null, intervalMs = 2500) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!url) return;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [url]);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      await load();
      if (alive) timer.current = setTimeout(tick, intervalMs);
    };
    tick();
    return () => {
      alive = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load, intervalMs]);

  return { data, error, reload: load, setData };
}

/** read a File as base64 data URL */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
