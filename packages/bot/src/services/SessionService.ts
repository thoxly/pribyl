import { Types } from "mongoose";
import SessionModel, { ISession } from "../models/Session";
import Session from "../models/Session";
import { UserSessionStore } from "../services/UserSessionStore";


export class SessionService {
  /**
   * Создаёт новую сессию, если её ещё нет для пользователя и задачи
   */

static async startSession(
    userId: Types.ObjectId,
    taskId?: Types.ObjectId
  ): Promise<ISession | null> {
    const query: any = {
      userId,
      endedAt: null,
    };

    if (taskId) {
      query.taskId = taskId;
    } else {
      query.taskId = { $exists: false };
    }

    const existing = await Session.findOne(query);
    if (existing) return existing;

    return Session.create({
      userId,
      taskId,
      startedAt: new Date(),
    });
  }


  /**
   * Завершает текущую активную сессию
   */
static async endSession(userId: Types.ObjectId): Promise<ISession | null> {
    const session = await Session.findOne({
      userId,
      endedAt: null,
    });

    if (!session) {
      console.debug("[SessionService] 🔍 No active session to end for user:", userId.toString());
      return null;
    }

    session.endedAt = new Date();
    await session.save();

    console.debug("[SessionService] ✅ Session ended:", session._id.toString());
    return session;
  }


    static async getActiveSession(
    userId: Types.ObjectId
  ): Promise<(ISession & { _id: Types.ObjectId }) | null> {
    return SessionModel
      .findOne({ userId, endedAt: { $exists: false } })
      .lean<ISession & { _id: Types.ObjectId }>();
  }
}
