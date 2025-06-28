// src/services/LiveWatchRepo.ts
import { Types } from "mongoose";
import LiveWatchModel, { ILiveWatch } from "../models/LiveWatch";
import logger from "../logger";

type UserId = Types.ObjectId;

export class LiveWatchRepo {
  /** создаём или перезаписываем watch */
  static async upsert(
    userId: UserId,
    messageId: number,
    expireAt: number, // ms
  ): Promise<void> {
    await LiveWatchModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          messageId,
          lastSeen: new Date(),
          expireAt: new Date(expireAt),
        },
      },
      { upsert: true }
    );
  }

  /** только обновляем lastSeen */
  static async touch(userId: UserId): Promise<void> {
    await LiveWatchModel.updateOne(
      { userId },
      { $set: { lastSeen: new Date() } }
    );
  }

  static async remove(userId: UserId): Promise<void> {
    await LiveWatchModel.deleteOne({ userId });
  }

  /** для warm-up при старте процесса */
  static async getActive(): Promise<ILiveWatch[]> {
    return LiveWatchModel.find({ expireAt: { $gt: new Date() } }).lean();
  }
}
