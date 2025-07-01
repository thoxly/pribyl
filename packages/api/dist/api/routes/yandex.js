"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/yandex.ts
const express_1 = __importDefault(require("express"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const router = express_1.default.Router();
const apiKey = process.env.YANDEX_API_KEY;
console.log("🌐 Получен запрос на /yandex-suggest");
console.log("🔑 YANDEX_API_KEY:", apiKey);
router.get("/yandex-suggest", async (req, res, next) => {
    const { text } = req.query;
    if (!text || typeof text !== "string") {
        res.status(400).json({ error: "No text provided" });
        return;
    }
    const apiKey = process.env.YANDEX_API_KEY;
    const url = `https://suggest-maps.yandex.ru/v1/suggest?apikey=${apiKey}&text=${encodeURIComponent(text)}&lang=ru_RU&type=geo`;
    console.log("📡 Полный запрос к Яндексу:", url);
    try {
        const response = await (0, node_fetch_1.default)(url);
        if (!response.ok) {
            res.status(response.status).json({ error: "Failed to fetch from Yandex" });
            return;
        }
        const data = await response.json();
        res.json(data); // без return, как ты просил
    }
    catch (err) {
        console.error("Ошибка при запросе к Яндексу:", err);
        next(err); // передаём в middleware обработки ошибок
    }
});
exports.default = router;
