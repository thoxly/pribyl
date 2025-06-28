

import { Types } from "mongoose";
import PositionModel, { IPosition } from "../models/Position";
import logger from "../logger";

export class PositionService {
  /**
   * Сохраняет координаты в позицию
   */
  static async savePosition(
    userId: Types.ObjectId,
    latitude: number,
    longitude: number,
    sessionId?: Types.ObjectId,
    taskId?: Types.ObjectId,
  ): Promise<IPosition> {
    try {
      const timestamp = new Date();

      logger.debug(
        `[PositionService] 🛰️ Saving position: userId=${userId}, lat=${latitude}, lon=${longitude}, sessionId=${sessionId}, taskId=${taskId}, timestamp=${timestamp.toISOString()}`
      );

      const position = await PositionModel.create({
        userId,
        sessionId,
        taskId,
        loc: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        timestamp,
      });

      logger.info(`[PositionService] ✅ Позиция сохранена: ${position._id}`);
      return position;
    } catch (error) {
      logger.error(
        `[PositionService] ❌ Ошибка при сохранении позиции: ${(error as Error).stack ?? error}`
      );
      throw error;
    }
  }
}

