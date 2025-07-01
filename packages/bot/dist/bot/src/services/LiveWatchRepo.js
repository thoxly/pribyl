"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveWatchRepo = void 0;
const LiveWatch_1 = __importDefault(require("../models/LiveWatch"));
class LiveWatchRepo {
    /** создаём или перезаписываем watch */
    static async upsert(userId, messageId, expireAt) {
        await LiveWatch_1.default.findOneAndUpdate({ userId }, {
            $set: {
                messageId,
                lastSeen: new Date(),
                expireAt: new Date(expireAt),
            },
        }, { upsert: true });
    }
    /** только обновляем lastSeen */
    static async touch(userId) {
        await LiveWatch_1.default.updateOne({ userId }, { $set: { lastSeen: new Date() } });
    }
    static async remove(userId) {
        await LiveWatch_1.default.deleteOne({ userId });
    }
    /** для warm-up при старте процесса */
    static async getActive() {
        return LiveWatch_1.default.find({ expireAt: { $gt: new Date() } }).lean();
    }
}
exports.LiveWatchRepo = LiveWatchRepo;
