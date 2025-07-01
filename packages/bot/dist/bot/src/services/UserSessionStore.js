"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSessionStore = void 0;
// services/UserSessionStore.ts
const FsmStat_1 = __importDefault(require("../models/FsmStat\u0435"));
class UserSessionStore {
    static async getState(userId) {
        console.debug(`[UserSessionStore] getState for userId: ${userId}`);
        const state = await FsmStat_1.default.findOne({ userId }).lean();
        console.debug(`[UserSessionStore] FSM state retrieved for userId: ${userId}:`, state);
        return state;
    }
    static async setState(userId, state, data = {}) {
        console.debug(`[UserSessionStore] setState for userId: ${userId}, state: ${state}, data:`, data);
        const current = await FsmStat_1.default.findOne({ userId }).lean();
        const mergedData = { ...(current?.data || {}), ...data };
        await FsmStat_1.default.findOneAndUpdate({ userId }, { state, data: mergedData, updatedAt: new Date() }, { upsert: true });
        console.debug(`[UserSessionStore] FSM state updated for userId: ${userId}`);
    }
    static async clearByTelegramId(telegramId) {
        console.debug(`[UserSessionStore] clearByTelegramId: ${telegramId}`);
        await FsmStat_1.default.deleteOne({ telegramId });
        console.debug(`[UserSessionStore] FSM state deleted for telegramId: ${telegramId}`);
    }
    static async setStateByTelegramId(telegramId, state, data = {}) {
        console.debug(`[UserSessionStore] setStateByTelegramId: ${telegramId}, state: ${state}, data:`, data);
        await FsmStat_1.default.findOneAndUpdate({ telegramId }, { state, data, updatedAt: new Date() }, { upsert: true });
        console.debug(`[UserSessionStore] FSM state updated for telegramId: ${telegramId}`);
    }
    static async getStateByTelegramId(telegramId) {
        console.debug(`[UserSessionStore] getStateByTelegramId: ${telegramId}`);
        const state = await FsmStat_1.default.findOne({ telegramId }).lean();
        console.debug(`[UserSessionStore] FSM state retrieved for telegramId: ${telegramId}:`, state);
        return state;
    }
}
exports.UserSessionStore = UserSessionStore;
