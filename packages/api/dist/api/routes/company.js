"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Company_1 = __importDefault(require("../models/Company"));
const User_1 = __importDefault(require("../models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
// Получить компанию по токену пользователя
router.get('/my-company', async (req, res, next) => {
    try {
        // Проверка токена
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'Не предоставлен токен авторизации' });
            return;
        }
        // Верификация токена
        if (!process.env.JWT_SECRET) {
            res.status(500).json({ error: 'Внутренняя ошибка сервера: отсутствует JWT_SECRET' });
            return;
        }
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        }
        catch (err) {
            res.status(401).json({ error: 'Неверный или просроченный токен' });
            return;
        }
        // Поиск пользователя с populate компании
        const user = await User_1.default.findById(payload.id).populate('company');
        if (!user) {
            res.status(404).json({ error: 'Пользователь не найден' });
            return;
        }
        if (!user.company) {
            res.status(404).json({ error: 'Пользователь не привязан к компании' });
            return;
        }
        // Возвращаем данные компании
        res.json(user.company);
    }
    catch (err) {
        next(err);
    }
});
router.post('/create-company', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            res.status(401).json({ error: "No token" });
            return;
        }
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const { name, inn, kpp, ogrn } = req.body;
        if (!name) {
            res.status(400).json({ error: "Название обязательно" });
            return;
        }
        // 1. Создаём компанию
        const company = await Company_1.default.create({ name, inn, kpp, ogrn, users: [payload.id] });
        // 2. Обновляем пользователя: привязываем к компании + ставим флаг онбординга
        await User_1.default.findByIdAndUpdate(payload.id, {
            company: company._id,
            onboardingCompleted: true,
        });
        res.json({ success: true, companyId: company._id });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
