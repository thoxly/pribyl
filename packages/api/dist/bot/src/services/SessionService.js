"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const Session_1 = __importDefault(require("../models/Session"));
const Session_2 = __importDefault(require("../models/Session"));
class SessionService {
    /**
     * Создаёт новую сессию, если её ещё нет для пользователя и задачи
     */
    static async startSession(userId, taskId) {
        const query = {
            userId,
            endedAt: null,
        };
        if (taskId) {
            query.taskId = taskId;
        }
        else {
            query.taskId = { $exists: false };
        }
        const existing = await Session_2.default.findOne(query);
        if (existing)
            return existing;
        return Session_2.default.create({
            userId,
            taskId,
            startedAt: new Date(),
        });
    }
    /**
     * Завершает текущую активную сессию
     */
    static async endSession(userId) {
        const session = await Session_2.default.findOne({
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
    static async getActiveSession(userId) {
        return Session_1.default
            .findOne({ userId, endedAt: { $exists: false } })
            .lean();
    }
}
exports.SessionService = SessionService;
