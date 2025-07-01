// src/hooks/useTrackSegments.ts
import { useEffect, useRef, useState } from "react";
import { toServerTime } from "../utils/timeUtils";

/** Параметры, которые приходит сверху из LiveYandexMap */
interface Params {
  workerId: string;
  /** ISO-строки, которые выбрал пользователь (локаль → client) */
  dateFrom: string; // «2025-06-26»
  dateTo: string;   // «2025-06-26»
}

export function useTrackSegments({ workerId, dateFrom, dateTo }: Params) {
  const [segments, setSegments] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!workerId || !dateFrom || !dateTo) {
      setSegments([]);
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);

    const serverDateFrom = toServerTime(`${dateFrom}T00:00:00`);
    const serverDateTo = toServerTime(`${dateTo}T23:59:59`);
    const params = new URLSearchParams({
      workerId,
      dateFrom: serverDateFrom,
      dateTo: serverDateTo,
    });
    const url = `/api/tracks/segments?${params.toString()}`;

    fetch(url, { signal: ac.signal })
      .then((res) => {
        if (res.status === 204) return [];
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((json: any) => {
        setSegments(json.coordinates ?? []);
      })
      .catch((err: any) => {
        if (err.name !== "AbortError") console.error(err);
      })
      .finally(() => {
        if (abortRef.current === ac) abortRef.current = null;
        setLoading(false);
      });
  }, [workerId, dateFrom, dateTo]);

  return { segments, loading };
}
