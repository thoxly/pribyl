// import http from "http";
// import dotenv from "dotenv";
// import mongoose from "mongoose";
// import app from "./app";
// import { bot } from "../bot/src/index";
// import { attachWebSocketServer } from "./wsServer";

// dotenv.config();

// const httpServer = http.createServer(app);

// console.log("📦 Инициализация Telegram webhook...");
// app.use(bot.webhookCallback("/telegram-webhook"));

// mongoose.connect(process.env.MONGODB_URI!).then(async () => {
//   const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

//   console.log("🔌 Подключение к MongoDB установлено");

//   attachWebSocketServer(httpServer); // WebSocket на том же сервере

//   httpServer.listen(PORT, async () => {
//     console.log(`🚀 HTTP + WS сервер запущен на http://localhost:${PORT}`);

//     const WEBHOOK_URL = process.env.WEBHOOK_URL!;
//     await bot.telegram.setWebhook(`${WEBHOOK_URL}/telegram-webhook`);

//     console.log("✅ Webhook установлен: ", `${WEBHOOK_URL}/telegram-webhook`);
//   });
// }).catch((err) => {
//   console.error("❌ Ошибка подключения к MongoDB:", err);
// });

import http from "http";
import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app";
import { bot } from "../bot/src/index";
import { attachWebSocketServer } from "./wsServer";

dotenv.config();

const httpServer = http.createServer(app);

// Webhook для Telegram
console.log("📦 Инициализация Telegram webhook...");
app.use(bot.webhookCallback("/telegram-webhook"));

async function startServer() {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  attachWebSocketServer(httpServer); // WebSocket на том же сервере

  httpServer.listen(PORT, async () => {
    console.log(`🚀 HTTP + WS сервер запущен на http://localhost:${PORT}`);

    const WEBHOOK_URL = process.env.WEBHOOK_URL;
    if (WEBHOOK_URL) {
      await bot.telegram.setWebhook(`${WEBHOOK_URL}/telegram-webhook`);
      console.log("✅ Webhook установлен:", `${WEBHOOK_URL}/telegram-webhook`);
    } else {
      console.warn("⚠️ WEBHOOK_URL не указан — webhook не установлен");
    }
  });
}

async function initApp() {
  const mongoUri =
  "mongodb://admin_sm:iS8Fek8BYuPVdYR7@ac-qdbxbai-shard-00-00.wkitq1z.mongodb.net:27017,ac-qdbxbai-shard-00-01.wkitq1z.mongodb.net:27017,ac-qdbxbai-shard-00-02.wkitq1z.mongodb.net:27017/?ssl=true&replicaSet=atlas-hzb9lh-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";


    // "mongodb+srv://admin_sm:iS8Fek8BYuPVdYR7@cluster0.wkitq1z.mongodb.net/tracker?retryWrites=true&w=majority&appName=Cluster0";
  console.log("🔎 Хардкод URI:", mongoUri);

  if (mongoUri) {
    console.log("🔎 Подключение к Mongo:", mongoUri);
  }
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, {
        family: 4, // IPv4, полезно в sandbox
        serverSelectionTimeoutMS: 10000,
      });
      console.log("🔌 Подключение к MongoDB Atlas установлено");
    } catch (err) {
      console.error("❌ Ошибка подключения к MongoDB Atlas:", err);
    }
  } else {
    console.warn("⚠️ MONGODB_URI не указан — БД пропущена");
  }

  await startServer();
}

initApp();
