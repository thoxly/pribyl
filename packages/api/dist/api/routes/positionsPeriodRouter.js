"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = require("mongoose");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const Position_1 = __importDefault(require("../models/Position"));
const router = (0, express_1.Router)();
/**
 * GET /api/reports/positions/period?dateFrom=2025-06-01&dateTo=2025-06-05[&workerId=<id>]
 *
 * ▸ dateFrom / dateTo – ISO-строки начала и конца периода (включительно).
 * ▸ workerId         – (опц.) ObjectId сотрудника.  Если не задан – берём всех.
 */
router.get("/tracker/period", authMiddleware_1.authMiddleware, async (req, res, next) => {
    try {
        const { dateFrom, dateTo, workerId } = req.query;
        console.debug("[positionsPeriodRouter] Запрос получен", { dateFrom, dateTo, workerId });
        if (!dateFrom || !dateTo) {
            console.debug("[positionsPeriodRouter] Пропущены обязательные параметры");
            res.status(400).json({ message: "dateFrom и dateTo обязательны" });
            return;
        }
        const currentUser = req.user;
        const companyId = currentUser.company;
        console.debug("[positionsPeriodRouter] Текущий пользователь", { userId: currentUser._id, companyId });
        const match = {
            timestamp: {
                $gte: new Date(dateFrom),
                $lte: new Date(dateTo),
            },
        };
        if (workerId) {
            match.userId = new mongoose_1.Types.ObjectId(workerId);
            console.debug("[positionsPeriodRouter] Добавлен фильтр по workerId", match.userId);
        }
        const pipeline = [
            { $match: match },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            { $match: { "user.company": companyId } },
            {
                $project: {
                    _id: 0,
                    userId: "$user._id",
                    fullName: "$user.fullName",
                    photoUrl: "$user.photoUrl",
                    latitude: { $arrayElemAt: ["$loc.coordinates", 1] },
                    longitude: { $arrayElemAt: ["$loc.coordinates", 0] },
                    timestamp: 1,
                },
            },
            { $sort: { timestamp: 1 } },
        ];
        console.debug("[positionsPeriodRouter] Агрегационный pipeline", JSON.stringify(pipeline, null, 2));
        const positions = await Position_1.default.aggregate(pipeline).exec();
        console.debug("[positionsPeriodRouter] Найдено позиций:", positions.length);
        res.json(positions);
    }
    catch (err) {
        console.error("[positionsPeriodRouter] Ошибка обработки запроса:", err);
        next(err);
    }
});
exports.default = router;
