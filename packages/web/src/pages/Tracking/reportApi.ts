// components/Reports/reportApi.ts
import type { WorkerLiveInfo } from "../../types/index";


export async function fetchPositionsByPeriod(
  workerId: string | undefined,
  dateFrom: string,
  dateTo: string
) {
  const params = new URLSearchParams({
    dateFrom,
    dateTo,
    ...(workerId && { workerId }),
  });

  const res = await fetch(`/api/tracker/period?${params}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    credentials: "include", 
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Не удалось загрузить позиции: ${text}`);
  }
  return res.json();
}


export async function fetchWorkers(): Promise<WorkerLiveInfo[]> {
  const res = await fetch("/api/workers/live?all=true", {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  if (!res.ok) throw new Error("Не удалось получить список сотрудников");
  return res.json();
}


export async function fetchTasksByWorker(workerId: string) {
  const res = await fetch(`/api/tasks?workerId=${workerId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.json();
}

export async function fetchPositionsByTask(taskId: string) {
  const res = await fetch(`/api/reports/task/${taskId}/positions`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.json();
}

/**
 * Загружает очищенный и упрощённый трек сотрудника за период
 */
export async function fetchCleanedTrack(
  workerId: string,
  dateFrom: string,
  dateTo: string
): Promise<[number, number][]> {
  const params = new URLSearchParams({ workerId, dateFrom, dateTo });
  const res = await fetch(`/api/tracks/segments?${params.toString()}`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  if (res.status === 204) {
    return [];
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Не удалось загрузить очищенный трек: ${text}`);
  }
  const json = (await res.json()) as { coordinates: [number, number][] };
  return json.coordinates;
}
