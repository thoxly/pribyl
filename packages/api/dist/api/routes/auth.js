"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = (0, express_1.Router)();
// POST /auth/telegram — авторизация через Telegram
router.post("/auth/telegram", async (req, res, next) => {
    try {
        const userData = req.body;
        if (!userData || typeof userData.id !== "number" || !userData.hash) {
            res.status(400).json({ error: "Invalid payload" });
            return;
        }
        const isValid = checkTelegramAuth(userData, process.env.BOT_TOKEN);
        if (!isValid) {
            res.status(401).json({ error: "Invalid auth signature" });
            return;
        }
        let user = await User_1.default.findOne({ telegramId: userData.id });
        if (!user) {
            user = await User_1.default.create({
                telegramId: userData.id,
                fullName: `${userData.first_name ?? ""} ${userData.last_name ?? ""}`.trim(),
                role: "admin",
                photoUrl: userData.photo_url,
                username: userData.username,
            });
        }
        else {
            user.fullName = `${userData.first_name ?? ""} ${userData.last_name ?? ""}`.trim();
            user.photoUrl = userData.photo_url;
            user.username = userData.username;
            user.role = "admin"; // обновление роли при повторной авторизации
            await user.save();
        }
        const token = jsonwebtoken_1.default.sign({
            id: user._id,
            telegramId: user.telegramId,
            fullName: user.fullName,
            role: user.role,
        }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({ token });
    }
    catch (error) {
        next(error);
    }
});
// GET /me — получить текущего пользователя
router.get("/me", async (req, res, next) => {
    try {
        const auth = req.headers.authorization?.split(" ")[1];
        if (!auth) {
            res.status(401).json({ error: "No token" });
            return;
        }
        const payload = jsonwebtoken_1.default.verify(auth, process.env.JWT_SECRET);
        const user = await User_1.default.findById(payload.id).populate('company').lean();
        if (!user) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        res.json(user);
    }
    catch (err) {
        next(err);
    }
});
// Проверка подписи Telegram авторизации
function checkTelegramAuth(data, botToken) {
    const { hash, ...rest } = data;
    const authData = {};
    for (const key in rest) {
        if (rest[key] !== undefined) {
            authData[key] = String(rest[key]);
        }
    }
    const dataCheckString = Object.keys(authData)
        .sort()
        .map((key) => `${key}=${authData[key]}`)
        .join("\n");
    const secret = crypto_1.default.createHash("sha256").update(botToken).digest();
    const hmac = crypto_1.default.createHmac("sha256", secret).update(dataCheckString).digest("hex");
    return hmac === hash;
}
exports.default = router;
