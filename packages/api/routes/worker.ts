import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireCompanyMiddleware } from "../middlewares/requireCompanyMiddleware";
import User , { IUser } from "../models/User";
import FsmState from "../models/FsmState";
import { Types } from "mongoose";


const router = Router();

router.get(
  "/workers",
  authMiddleware,
  requireCompanyMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.company;

      const workers = await User.find({ role: "worker", company: companyId })
        .select("fullName photoUrl inviteCode onboardingCompleted status");

      res.json(workers);
    } catch (err) {
      next(err);
    }
  }
);

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

router.get(
  "/workers/live",
  authMiddleware,
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      /* 1. Читаем FSM: { userId, data.liveLocation } */
      type StateLean = {
        userId: Types.ObjectId;
        data?: {
          liveLocation?: {
            active?: boolean;
            lastSeen?: Date;
          };
        };
      };

      const states = await FsmState
        .find({}, { userId: 1, "data.liveLocation": 1 })
        .lean<StateLean[]>();

      const stateByUser = new Map<
        string,
        { active: boolean; lastSeen?: Date }
      >(
        states.map((s) => [
          s.userId.toString(),
          {
            active: s.data?.liveLocation?.active ?? false,
            lastSeen: s.data?.liveLocation?.lastSeen,
          },
        ])
      );

      /* 2. Загружаем пользователей (фильтровать можно по роли, если нужно) */
      const users = await User
        .find({}, "fullName photoUrl")
        .lean<IUser[]>();

      /* 3. Формируем ответ */
      res.json(
        users.map((u) => {
          const st = stateByUser.get(u._id.toString()) ?? { active: false };
          return {
            _id: u._id,
            fullName: u.fullName,
            photoUrl: u.photoUrl,
            liveLocationActive: st.active,   // для обратной совместимости
            lastSeen: st.lastSeen ?? null,   // новая опция
          };
        })
      );
    } catch (err) {
      next(err);
    }
  }
);





export default router;

