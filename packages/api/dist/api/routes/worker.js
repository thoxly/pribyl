"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const requireCompanyMiddleware_1 = require("../middlewares/requireCompanyMiddleware");
const User_1 = __importDefault(require("../models/User"));
const FsmState_1 = __importDefault(require("../models/FsmState"));
const mongoose_1 = require("mongoose");
const router = (0, express_1.Router)();
router.get("/workers", authMiddleware_1.authMiddleware, requireCompanyMiddleware_1.requireCompanyMiddleware, async (req, res, next) => {
    try {
        const companyId = req.user.company;
        const workers = await User_1.default.find({
            role: "worker",
            company: companyId,
        }).select("fullName photoUrl inviteCode onboardingCompleted status");
        res.json(workers);
    }
    catch (err) {
        next(err);
    }
});
// router.get(
//   '/workers/live',
//   authMiddleware,
//   async (
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ): Promise<void> => {
//     try {
//       console.debug('[GET /workers/live] Запрос получен. Параметры:', req.query);
//       // 1) получаем все FSM состояния с userId и data.liveLocationActive
//       const states = await FsmState.find({}, 'userId data')
//         .lean<{ userId: Types.ObjectId; data?: { liveLocationActive?: boolean } }[]>();
//       console.debug(`[GET /workers/live] Найдено состояний FSM: ${states.length}`);
//       const stateByUser = new Map(
//         states.map((s) => [
//           s.userId.toString(),
//           s.data?.liveLocationActive ?? false,
//         ])
//       );
//       console.debug('[GET /workers/live] Сформирована карта stateByUser:', [...stateByUser.entries()]);
//       // 2) фильтрация пользователей
//       const filter =
//         req.query.all === 'true'
//           ? {}
//           : { _id: { $in: Array.from(stateByUser.keys(), (id) => new Types.ObjectId(id)) } };
//       console.debug('[GET /workers/live] Применён фильтр пользователей:', filter);
//       const users = await User.find(filter, 'fullName photoUrl')
//         .lean<IUser[]>();
//       console.debug(`[GET /workers/live] Найдено пользователей: ${users.length}`);
//       const result = users.map((u) => ({
//         _id: u._id,
//         fullName: u.fullName,
//         photoUrl: u.photoUrl,
//         liveLocationActive: stateByUser.get(u._id.toString()) ?? false,
//       }));
//       console.debug('[GET /workers/live] Сформирован результат:', result);
//       res.json(result);
//     } catch (err) {
//       console.error('[GET /workers/live] Ошибка:', err);
//       next(err);
//     }
//   }
// );
router.get("/workers/live", authMiddleware_1.authMiddleware, async (_req, res, next) => {
    try {
        const states = await FsmState_1.default.find({}, { userId: 1, "data.liveLocation": 1 }).lean();
        const stateByUser = new Map(states
            .filter((s) => {
            return s.userId && mongoose_1.Types.ObjectId.isValid(s.userId);
        })
            .map((s) => [
            s.userId.toString(),
            {
                active: s.data?.liveLocation?.active ?? false,
                lastSeen: s.data?.liveLocation?.lastSeen,
            },
        ]));
        /* 2. Загружаем пользователей (фильтровать можно по роли, если нужно) */
        const users = await User_1.default.find({}, "fullName photoUrl").lean();
        /* 3. Формируем ответ */
        res.json(users.map((u) => {
            const st = stateByUser.get(u._id.toString()) ?? { active: false };
            return {
                _id: u._id,
                fullName: u.fullName,
                photoUrl: u.photoUrl,
                liveLocationActive: st.active, // для обратной совместимости
                lastSeen: st.lastSeen ?? null, // новая опция
            };
        }));
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
