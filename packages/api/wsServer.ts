import { WebSocketServer } from "ws";
import { Server } from "http";

let wss: WebSocketServer;

export const attachWebSocketServer = (server: Server) => {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("🟢 WebSocket клиент подключен");

    ws.send(JSON.stringify({ type: "connected" }));
  });
};

export const broadcastTaskUpdate = (taskId: string) => {
  if (!wss) return;
  const msg = JSON.stringify({ type: "task-updated", taskId });
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(msg);
    }
  });
};
