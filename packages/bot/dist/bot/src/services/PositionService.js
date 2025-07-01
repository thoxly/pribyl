"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionService = void 0;
const Position_1 = __importDefault(require("../models/Position"));
const logger_1 = __importDefault(require("../logger"));
class PositionService {
    /**
     * Сохраняет координаты в позицию
     */
    static async savePosition(userId, latitude, longitude, sessionId, taskId) {
        try {
            const timestamp = new Date();
            logger_1.default.debug(`[PositionService] 🛰️ Saving position: userId=${userId}, lat=${latitude}, lon=${longitude}, sessionId=${sessionId}, taskId=${taskId}, timestamp=${timestamp.toISOString()}`);
            const position = await Position_1.default.create({
                userId,
                sessionId,
                taskId,
                loc: {
                    type: "Point",
                    coordinates: [longitude, latitude],
                },
                timestamp,
            });
            logger_1.default.info(`[PositionService] ✅ Позиция сохранена: ${position._id}`);
            return position;
        }
        catch (error) {
            logger_1.default.error(`[PositionService] ❌ Ошибка при сохранении позиции: ${error.stack ?? error}`);
            throw error;
        }
    }
}
exports.PositionService = PositionService;
