import http from "http";
import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app";
import { bot } from "../bot/src/index";
import { attachWebSocketServer } from "./wsServer";

dotenv.config();

const httpServer = http.createServer(app);

console.log("📦 Инициализация Telegram webhook...");
app.use(bot.webhookCallback("/telegram-webhook"));

mongoose.connect(process.env.MONGODB_URI!).then(async () => {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  console.log("🔌 Подключение к MongoDB установлено");

  attachWebSocketServer(httpServer); // WebSocket на том же сервере

  httpServer.listen(PORT, async () => {
    console.log(`🚀 HTTP + WS сервер запущен на http://localhost:${PORT}`);

    const WEBHOOK_URL = process.env.WEBHOOK_URL!;
    await bot.telegram.setWebhook(`${WEBHOOK_URL}/telegram-webhook`);

    console.log("✅ Webhook установлен: ", `${WEBHOOK_URL}/telegram-webhook`);
  });
}).catch((err) => {
  console.error("❌ Ошибка подключения к MongoDB:", err);
});
