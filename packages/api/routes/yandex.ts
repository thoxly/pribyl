// routes/yandex.ts
import express, { Request, Response, NextFunction } from "express";
import fetch from "node-fetch";

const router = express.Router();

const apiKey = process.env.YANDEX_API_KEY;

console.log("🌐 Получен запрос на /yandex-suggest");
console.log("🔑 YANDEX_API_KEY:", apiKey);

router.get(
  "/yandex-suggest",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { text } = req.query;

    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "No text provided" });
      return;
    }

    const apiKey = process.env.YANDEX_API_KEY;
    const url = `https://suggest-maps.yandex.ru/v1/suggest?apikey=${apiKey}&text=${encodeURIComponent(
      text
    )}&lang=ru_RU&type=geo`;

    console.log("📡 Полный запрос к Яндексу:", url);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        res.status(response.status).json({ error: "Failed to fetch from Yandex" });
        return;
      }

      const data = await response.json();
      res.json(data); // без return, как ты просил
    } catch (err) {
      console.error("Ошибка при запросе к Яндексу:", err);
      next(err); // передаём в middleware обработки ошибок
    }
  }
);

export default router;
