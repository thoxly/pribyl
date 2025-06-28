// hooks/useWorkersLive.ts
import { useCallback, useEffect, useState } from 'react';
import type { WorkerLiveInfo } from '../types/index';

export const useWorkersLive = () => {
  const [workers, setWorkers] = useState<WorkerLiveInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchWorkers = useCallback(async () => {
    console.debug('[useWorkersLive] Запрос списка сотрудников начат...');
    try {
      const token = localStorage.getItem('token');
      console.debug('[useWorkersLive] Токен из localStorage:', token);

      const res = await fetch('/workers/live?all=true', {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error('[useWorkersLive] Ошибка при получении данных:', res.status, res.statusText);
        throw new Error('Не удалось получить список сотрудников');
      }

      const data: WorkerLiveInfo[] = await res.json();
      console.debug('[useWorkersLive] Получены данные сотрудников:', data);

      setWorkers(data);
    } catch (error) {
      console.error('[useWorkersLive] Ошибка запроса:', error);
    } finally {
      setLoading(false);
      console.debug('[useWorkersLive] Загрузка завершена');
    }
  }, []);

  useEffect(() => {
    console.debug('[useWorkersLive] useEffect запущен');
    fetchWorkers();
    const id = setInterval(fetchWorkers, 10_000);
    return () => {
      clearInterval(id);
      console.debug('[useWorkersLive] Очистка интервала');
    };
  }, [fetchWorkers]);

  return { workers, loading };
};
