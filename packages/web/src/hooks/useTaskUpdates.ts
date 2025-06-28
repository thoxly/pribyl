import { useEffect } from "react";

export function useTaskUpdates(onUpdate: (taskId: string) => void) {
  useEffect(() => {
    // 👇 формируем WebSocket-адрес из VITE_API_BASE_URL
    const wsBase = import.meta.env.VITE_API_BASE_URL.replace(/^http/, "ws");
    const socket = new WebSocket(`${wsBase}/ws`);

    socket.onopen = () => {
      console.log("🟢 WebSocket открыт:", wsBase);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "task-updated") {
          onUpdate(data.taskId);
        }
      } catch (err) {
        console.error("Ошибка обработки WebSocket-сообщения:", err);
      }
    };

    socket.onerror = (err) => {
      console.error("🔴 WebSocket ошибка:", err);
    };

    return () => socket.close();
  }, [onUpdate]);
}
