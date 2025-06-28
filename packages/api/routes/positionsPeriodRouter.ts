import { Router, Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { authMiddleware } from "../middlewares/authMiddleware";
import { IUser } from "../models/User";
import PositionModel, { IPosition } from "../models/Position";
import type { PipelineStage } from "mongoose";

const router = Router();

/**
 * GET /api/reports/positions/period?dateFrom=2025-06-01&dateTo=2025-06-05[&workerId=<id>]
 *
 * ▸ dateFrom / dateTo – ISO-строки начала и конца периода (включительно).
 * ▸ workerId         – (опц.) ObjectId сотрудника.  Если не задан – берём всех.
 */
router.get(
  "/tracker/period",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dateFrom, dateTo, workerId } = req.query as Record<string, string>;
      console.debug("[positionsPeriodRouter] Запрос получен", { dateFrom, dateTo, workerId });

      if (!dateFrom || !dateTo) {
        console.debug("[positionsPeriodRouter] Пропущены обязательные параметры");
        res.status(400).json({ message: "dateFrom и dateTo обязательны" });
        return;
      }

      const currentUser = req.user as IUser;
      const companyId = currentUser.company;
      console.debug("[positionsPeriodRouter] Текущий пользователь", { userId: currentUser._id, companyId });

      const match: Record<string, unknown> = {
        timestamp: {
          $gte: new Date(dateFrom),
          $lte: new Date(dateTo),
        },
      };

      if (workerId) {
        match.userId = new Types.ObjectId(workerId);
        console.debug("[positionsPeriodRouter] Добавлен фильтр по workerId", match.userId);
      }

      const pipeline: PipelineStage[] = [
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

      const positions = await PositionModel.aggregate(pipeline).exec();

      console.debug("[positionsPeriodRouter] Найдено позиций:", positions.length);
      res.json(positions);
    } catch (err) {
      console.error("[positionsPeriodRouter] Ошибка обработки запроса:", err);
      next(err);
    }
  }
);


export default router;
