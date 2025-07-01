"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLiveLocationHandler = void 0;
const telegraf_1 = require("telegraf");
const mongoose_1 = require("mongoose");
const User_1 = __importDefault(require("../models/User"));
const Task_1 = __importDefault(require("../models/Task"));
const LiveLocationService_1 = __importDefault(require("../services/LiveLocationService"));
const TaskService_1 = __importDefault(require("../services/TaskService"));
const UserSessionStore_1 = require("../services/UserSessionStore");
const SessionService_1 = require("../services/SessionService");
const PositionService_1 = require("../services/PositionService");
const LiveLocationWatchdog_1 = require("../services/LiveLocationWatchdog");
const logger_1 = __importDefault(require("../logger"));
const registerLiveLocationHandler = (bot) => {
    bot.on(["message", "edited_message"], async (ctx, next) => {
        const msg = ctx.message ?? ctx.editedMessage;
        if (!msg?.location)
            return void next();
        try {
            const timestamp = new Date().toISOString();
            logger_1.default.debug(`💬 New location received at ${timestamp}`);
            const telegramId = ctx.from?.id?.toString();
            if (!telegramId) {
                logger_1.default.warn("No telegramId found in context");
                return void next();
            }
            const user = await User_1.default.findOne({ telegramId }).lean();
            if (!user) {
                logger_1.default.warn(`User not found by telegramId: ${telegramId}`);
                return void next();
            }
            const userId = user._id;
            logger_1.default.debug(`📍 User: ${user.fullName ?? userId}`);
            const hasLivePeriod = typeof msg.location.live_period === "number";
            if (!ctx.editedMessage && hasLivePeriod) {
                logger_1.default.debug(`🔄 Starting live location watchdog`);
                (0, LiveLocationWatchdog_1.startWatch)(userId, msg.message_id, msg.date, msg.location.live_period);
            }
            (0, LiveLocationWatchdog_1.updateWatch)(userId, hasLivePeriod);
            const { latitude, longitude } = msg.location;
            logger_1.default.debug(`🌐 Location: lat=${latitude}, lon=${longitude}`);
            const fsm = await UserSessionStore_1.UserSessionStore.getState(userId);
            const fsmTaskId = fsm?.data?.taskId && mongoose_1.Types.ObjectId.isValid(fsm.data.taskId)
                ? new mongoose_1.Types.ObjectId(fsm.data.taskId)
                : undefined;
            await LiveLocationService_1.default.setLiveLocationActive(userId, true);
            logger_1.default.debug(`✅ Set liveLocationActive = true for ${userId}`);
            let session = await SessionService_1.SessionService.getActiveSession(userId);
            if (!session) {
                logger_1.default.debug(`ℹ️ No active session, starting new`);
                session = await SessionService_1.SessionService.startSession(userId, fsmTaskId);
            }
            else if (fsmTaskId && (!session.taskId || String(session.taskId) !== String(fsmTaskId))) {
                logger_1.default.warn(`⚠️ Mismatch session.taskId=${session.taskId} vs fsmTaskId=${fsmTaskId}`);
                await SessionService_1.SessionService.endSession(session._id);
                session = await SessionService_1.SessionService.startSession(userId, fsmTaskId);
            }
            if (!session) {
                logger_1.default.error(`❌ Session creation failed for ${userId}`);
                return void next();
            }
            await PositionService_1.PositionService.savePosition(userId, latitude, longitude, session._id, fsmTaskId);
            logger_1.default.debug(`📌 Position saved for session ${session._id}`);
            if (fsmTaskId) {
                if (fsm?.state === "awaiting_location") {
                    logger_1.default.debug(`🟢 Task started via location for ${fsmTaskId}`);
                    await TaskService_1.default.startTask(userId);
                    await UserSessionStore_1.UserSessionStore.setState(userId, "task_in_progress", {
                        taskId: fsmTaskId.toString(),
                        liveLocation: { active: true },
                    });
                    const task = await Task_1.default.findById(fsmTaskId).lean();
                    await ctx.reply(`📍 Локация получена. Задача *${task?.title ?? "Без названия"}* начата.`, {
                        parse_mode: "Markdown",
                        ...telegraf_1.Markup.inlineKeyboard([
                            [telegraf_1.Markup.button.callback("✅ Завершить задачу", `complete_${fsmTaskId}`)],
                        ]),
                    });
                }
            }
            else {
                await UserSessionStore_1.UserSessionStore.setState(userId, "free_live", {
                    liveLocation: { active: true },
                });
                if (fsm?.state !== "free_live")
                    await ctx.reply("📍 Локация получена.");
            }
        }
        catch (e) {
            logger_1.default.error(`[LiveLocation] ❌ Error: ${e.stack ?? e}`);
            await ctx.reply("Ошибка при обработке локации");
        }
        await next();
    });
};
exports.registerLiveLocationHandler = registerLiveLocationHandler;
