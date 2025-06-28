// services/UserSessionStore.ts
import FsmState, { IFsmState } from "../models/FsmStatе";
import { Types } from "mongoose";

export class UserSessionStore {


  static async getState(userId: Types.ObjectId): Promise<IFsmState | null> {
    console.debug(`[UserSessionStore] getState for userId: ${userId}`);
    const state = await FsmState.findOne({ userId }).lean<IFsmState>();
    console.debug(`[UserSessionStore] FSM state retrieved for userId: ${userId}:`, state);
    return state;
  }

  static async setState(userId: Types.ObjectId, state: string, data = {}) {
    console.debug(`[UserSessionStore] setState for userId: ${userId}, state: ${state}, data:`, data);
    const current = await FsmState.findOne({ userId }).lean<IFsmState>();
    const mergedData = { ...(current?.data || {}), ...data };
    await FsmState.findOneAndUpdate(
      { userId },
      { state, data: mergedData, updatedAt: new Date() },
      { upsert: true }
    );
    console.debug(`[UserSessionStore] FSM state updated for userId: ${userId}`);
  }

  static async clearByTelegramId(telegramId: number) {
    console.debug(`[UserSessionStore] clearByTelegramId: ${telegramId}`);
    await FsmState.deleteOne({ telegramId });
    console.debug(`[UserSessionStore] FSM state deleted for telegramId: ${telegramId}`);
  }

  static async setStateByTelegramId(
    telegramId: number,
    state: string,
    data = {}
  ) {
    console.debug(`[UserSessionStore] setStateByTelegramId: ${telegramId}, state: ${state}, data:`, data);
    await FsmState.findOneAndUpdate(
      { telegramId },
      { state, data, updatedAt: new Date() },
      { upsert: true }
    );
    console.debug(`[UserSessionStore] FSM state updated for telegramId: ${telegramId}`);
  }

  static async getStateByTelegramId(
    telegramId: number
  ): Promise<IFsmState | null> {
    console.debug(`[UserSessionStore] getStateByTelegramId: ${telegramId}`);
    const state = await FsmState.findOne({ telegramId }).lean<IFsmState>();
    console.debug(`[UserSessionStore] FSM state retrieved for telegramId: ${telegramId}:`, state);
    return state;
  }


  // static async clear(userId: Types.ObjectId) {
  //   console.debug(`[UserSessionStore] clear FSM for userId: ${userId}`);
  //   await FsmState.deleteOne({ userId });
  //   console.debug(`[UserSessionStore] FSM state deleted for userId: ${userId}`);
  // }
}
