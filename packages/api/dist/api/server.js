"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const index_1 = require("../bot/src/index");
const wsServer_1 = require("./wsServer");
dotenv_1.default.config();
const httpServer = http_1.default.createServer(app_1.default);
console.log("📦 Инициализация Telegram webhook...");
app_1.default.use(index_1.bot.webhookCallback("/telegram-webhook"));
mongoose_1.default.connect(process.env.MONGODB_URI).then(async () => {
    const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
    console.log("🔌 Подключение к MongoDB установлено");
    (0, wsServer_1.attachWebSocketServer)(httpServer); // WebSocket на том же сервере
    httpServer.listen(PORT, async () => {
        console.log(`🚀 HTTP + WS сервер запущен на http://localhost:${PORT}`);
        const WEBHOOK_URL = process.env.WEBHOOK_URL;
        await index_1.bot.telegram.setWebhook(`${WEBHOOK_URL}/telegram-webhook`);
        console.log("✅ Webhook установлен: ", `${WEBHOOK_URL}/telegram-webhook`);
    });
}).catch((err) => {
    console.error("❌ Ошибка подключения к MongoDB:", err);
});
