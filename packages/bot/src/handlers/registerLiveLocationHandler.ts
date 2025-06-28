import { Telegraf, Context, Markup } from "telegraf";
import { Types } from "mongoose";
import UserModel, { IUser } from "../models/User";
import TaskModel, { ITask } from "../models/Task";
import LiveLocationService from "../services/LiveLocationService";
import TaskService from "../services/TaskService";
import { UserSessionStore } from "../services/UserSessionStore";
import { SessionService } from "../services/SessionService";
import { PositionService } from "../services/PositionService";
import { startWatch, updateWatch } from "../services/LiveLocationWatchdog";
import logger from "../logger";


export const registerLiveLocationHandler = (bot: Telegraf<Context>): void => {
  bot.on(["message", "edited_message"], async (ctx, next): Promise<void> => {
    const msg: any = ctx.message ?? ctx.editedMessage;
    if (!msg?.location) return void next();

    try {
      const timestamp = new Date().toISOString();
      logger.debug(`💬 New location received at ${timestamp}`);

      const telegramId = ctx.from?.id?.toString();
      if (!telegramId) {
        logger.warn("No telegramId found in context");
        return void next();
      }

      const user = await UserModel.findOne({ telegramId }).lean<IUser & { _id: Types.ObjectId }>();
      if (!user) {
        logger.warn(`User not found by telegramId: ${telegramId}`);
        return void next();
      }

      const userId = user._id;
      logger.debug(`📍 User: ${user.fullName ?? userId}`);

      const hasLivePeriod = typeof msg.location.live_period === "number";
      if (!ctx.editedMessage && hasLivePeriod) {
        logger.debug(`🔄 Starting live location watchdog`);
        startWatch(userId, msg.message_id, msg.date, msg.location.live_period);
      }
      updateWatch(userId, hasLivePeriod);

      const { latitude, longitude } = msg.location;
      logger.debug(`🌐 Location: lat=${latitude}, lon=${longitude}`);

      const fsm = await UserSessionStore.getState(userId);
      const fsmTaskId = fsm?.data?.taskId && Types.ObjectId.isValid(fsm.data.taskId)
        ? new Types.ObjectId(fsm.data.taskId)
        : undefined;

      await LiveLocationService.setLiveLocationActive(userId, true);
      logger.debug(`✅ Set liveLocationActive = true for ${userId}`);

      let session = await SessionService.getActiveSession(userId);
      if (!session) {
        logger.debug(`ℹ️ No active session, starting new`);
        session = await SessionService.startSession(userId, fsmTaskId);
      } else if (fsmTaskId && (!session.taskId || String(session.taskId) !== String(fsmTaskId))) {
        logger.warn(`⚠️ Mismatch session.taskId=${session.taskId} vs fsmTaskId=${fsmTaskId}`);
        await SessionService.endSession(session._id);
        session = await SessionService.startSession(userId, fsmTaskId);
      }
      if (!session) {
        logger.error(`❌ Session creation failed for ${userId}`);
        return void next();
      }

      await PositionService.savePosition(userId, latitude, longitude, session._id, fsmTaskId);
      logger.debug(`📌 Position saved for session ${session._id}`);

      if (fsmTaskId) {
        if (fsm?.state === "awaiting_location") {
          logger.debug(`🟢 Task started via location for ${fsmTaskId}`);
          await TaskService.startTask(userId);
          await UserSessionStore.setState(userId, "task_in_progress", {
            taskId: fsmTaskId.toString(),
            liveLocation: { active: true },
          });

          const task = await TaskModel.findById(fsmTaskId).lean<ITask>();
          await ctx.reply(`📍 Локация получена. Задача *${task?.title ?? "Без названия"}* начата.`, {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([
              [Markup.button.callback("✅ Завершить задачу", `complete_${fsmTaskId}`)],
            ]),
          });
        }
      } else {
        await UserSessionStore.setState(userId, "free_live", {
          liveLocation: { active: true },
        });
        if (fsm?.state !== "free_live") await ctx.reply("📍 Локация получена.");
      }
    } catch (e) {
      logger.error(`[LiveLocation] ❌ Error: ${(e as Error).stack ?? e}`);
      await ctx.reply("Ошибка при обработке локации");
    }

    await next();
  });
};
