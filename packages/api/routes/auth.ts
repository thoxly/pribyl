import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

// POST /auth/telegram — авторизация через Telegram
router.post("/auth/telegram", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userData = req.body;

    if (!userData || typeof userData.id !== "number" || !userData.hash) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }

    const isValid = checkTelegramAuth(userData, process.env.BOT_TOKEN!);
    if (!isValid) {
      res.status(401).json({ error: "Invalid auth signature" });
      return;
    }

    let user = await User.findOne({ telegramId: userData.id });

    if (!user) {
      user = await User.create({
        telegramId: userData.id,
        fullName: `${userData.first_name ?? ""} ${userData.last_name ?? ""}`.trim(),
        role: "admin",
        photoUrl: userData.photo_url,
        username: userData.username,
      });
    } else {
      user.fullName = `${userData.first_name ?? ""} ${userData.last_name ?? ""}`.trim();
      user.photoUrl = userData.photo_url;
      user.username = userData.username;
      user.role = "admin"; // обновление роли при повторной авторизации

      await user.save();
    }

    const token = jwt.sign(
      {
        id: user._id,
        telegramId: user.telegramId,
        fullName: user.fullName,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (error) {
    next(error);
  }
});

// GET /me — получить текущего пользователя
router.get("/me", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const auth = req.headers.authorization?.split(" ")[1];
    if (!auth) {
      res.status(401).json({ error: "No token" });
      return;
    }

    const payload = jwt.verify(auth, process.env.JWT_SECRET!) as { id: string };

    const user = await User.findById(payload.id).populate('company').lean();

    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Проверка подписи Telegram авторизации
function checkTelegramAuth(data: any, botToken: string): boolean {
  const { hash, ...rest } = data;

  const authData: Record<string, string> = {};
  for (const key in rest) {
    if (rest[key] !== undefined) {
      authData[key] = String(rest[key]);
    }
  }

  const dataCheckString = Object.keys(authData)
    .sort()
    .map((key) => `${key}=${authData[key]}`)
    .join("\n");

  const secret = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

  return hmac === hash;
}

export default router;
