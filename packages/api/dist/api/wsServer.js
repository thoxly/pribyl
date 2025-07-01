"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastTaskUpdate = exports.attachWebSocketServer = void 0;
const ws_1 = require("ws");
let wss;
const attachWebSocketServer = (server) => {
    wss = new ws_1.WebSocketServer({ server });
    wss.on("connection", (ws) => {
        console.log("🟢 WebSocket клиент подключен");
        ws.send(JSON.stringify({ type: "connected" }));
    });
};
exports.attachWebSocketServer = attachWebSocketServer;
const broadcastTaskUpdate = (taskId) => {
    if (!wss)
        return;
    const msg = JSON.stringify({ type: "task-updated", taskId });
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(msg);
        }
    });
};
exports.broadcastTaskUpdate = broadcastTaskUpdate;
