// src/routes/tracksSegmentsRouter.ts
import { Router, Request, Response, NextFunction } from "express";
import { cleanTrack } from "../services/trackSimplifier";
import Position, { IPosition } from "../models/Position";

const router = Router();

/**
 * GET /api/tracks/segments
 *   ?workerId=<MongoId>
 *   &dateFrom=<ISO-UTC>
 *   &dateTo=<ISO-UTC>
 *
 * Пример:
 *   /api/tracks/segments?workerId=...&dateFrom=2025-06-26T00:00:00Z&dateTo=2025-06-26T23:59:59Z
 */
router.get(
  "/tracks/segments",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workerId, dateFrom, dateTo } = req.query as Record<string, string>;

      if (!workerId || !dateFrom || !dateTo) {
        res
          .status(400)
          .json({ message: "workerId, dateFrom и dateTo обязательны" });
        return;
      }

      const start = new Date(dateFrom);
      const end = new Date(dateTo);

      if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
        res.status(400).json({ message: "dateFrom или dateTo имеет неверный формат" });
        return;
      }

      const raw: IPosition[] = await Position.find({
        userId: workerId,
        timestamp: { $gte: start, $lte: end },
      });

      if (raw.length < 2) {
        res.status(204).end();
        return;
      }

      const coordinates = cleanTrack(raw);
      res.json({ coordinates });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
