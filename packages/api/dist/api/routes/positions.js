"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/positionsLive.ts
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const FsmState_1 = __importDefault(require("../models/FsmState"));
const mongoose_1 = require("mongoose");
const router = (0, express_1.Router)();
/**
 *   GET /positions/live
 *   ?workerId=...   – (необяз.) отдать только одного сотрудника
 *
 *   Ответ: Array<{
 *     userId: ObjectId;
 *     fullName: string;
 *     photoUrl?: string;
 *     latitude: number;
 *     longitude: number;
 *     timestamp: Date;
 *   }>
 */
// router.get(
//   "/live",
//   authMiddleware,
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       console.debug("[GET /live] Запрос получен. Параметры запроса:", req.query);
//       const { workerId } = req.query as { workerId?: string };
//       const since = new Date(Date.now() - 10 * 60 * 1000);
//       const match: Record<string, any> = { timestamp: { $gte: since } };
//       if (workerId) {
//         match.userId = new Types.ObjectId(workerId);
//         console.debug("[GET /live] Фильтрация по workerId:", workerId);
//       }
//       console.debug("[GET /live] Условия match:", match);
//       const positions = await Position.aggregate([
//         { $match: match },
//         { $sort: { timestamp: -1 } },
//         { $group: { _id: "$userId", doc: { $first: "$$ROOT" } } },
//         { $replaceRoot: { newRoot: "$doc" } },
//         {
//           $lookup: {
//             from: "users",
//             localField: "userId",
//             foreignField: "_id",
//             as: "user",
//           },
//         },
//         { $unwind: "$user" },
//         {
//           $project: {
//             _id: 0,
//             userId: "$user._id",
//             fullName: "$user.fullName",
//             photoUrl: "$user.photoUrl",
//             latitude: { $arrayElemAt: ["$loc.coordinates", 1] },
//             longitude: { $arrayElemAt: ["$loc.coordinates", 0] },
//             timestamp: 1,
//           },
//         },
//       ]);
//       console.debug(`[GET /live] Найдено позиций: ${positions.length}`);
//       console.debug("[GET /live] Результаты:", JSON.stringify(positions, null, 2));
//       res.json(positions);
//     } catch (err) {
//       console.error("[GET /live] Ошибка:", err);
//       next(err);
//     }
//   }
// );
router.get("/live", authMiddleware_1.authMiddleware, async (req, res, _next) => {
    console.debug("[GET /live] query:", req.query);
    const { workerId } = req.query;
    /* базовый match — только активные sharing-и */
    const match = { "data.liveLocation.active": true };
    /* опционально конкретный worker */
    if (workerId && mongoose_1.Types.ObjectId.isValid(workerId)) {
        match.userId = new mongoose_1.Types.ObjectId(workerId);
    }
    /* доп. окно «последние 10 минут» — необязательно, но безопасно */
    const since = new Date(Date.now() - 10 * 60 * 1000);
    match["data.liveLocation.lastSeen"] = { $gte: since };
    const live = await FsmState_1.default.aggregate([
        { $match: match },
        /* подтягиваем последнюю позицию */
        {
            $lookup: {
                from: "positions",
                let: { uid: "$userId" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$userId", "$$uid"] } } },
                    { $sort: { timestamp: -1 } },
                    { $limit: 1 },
                ],
                as: "pos",
            },
        },
        { $unwind: "$pos" },
        /* подтягиваем данные пользователя */
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: "$user" },
        /* итоговая проекция */
        {
            $project: {
                _id: 0,
                userId: "$user._id",
                fullName: "$user.fullName",
                photoUrl: "$user.photoUrl",
                latitude: { $arrayElemAt: ["$pos.loc.coordinates", 1] },
                longitude: { $arrayElemAt: ["$pos.loc.coordinates", 0] },
                timestamp: "$pos.timestamp",
            },
        },
    ]);
    console.debug("[GET /live] found:", live.length);
    res.json(live);
});
exports.default = router;
