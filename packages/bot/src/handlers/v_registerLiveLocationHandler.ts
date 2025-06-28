// import { Telegraf, Context, Markup } from "telegraf";
// import { Types } from "mongoose";
// import UserModel, { IUser } from "../models/User";
// import TaskModel, { ITask } from "../models/Task";
// import LiveLocationService from "../services/LiveLocationService";
// import TaskService from "../services/TaskService";
// import { UserSessionStore } from "../services/UserSessionStore";
// import { SessionService } from "../services/SessionService";
// import { PositionService } from "../services/PositionService";
// import {
//   startWatch,
//   updateWatch,          // stopWatch понадобится, если добавите inline-кнопку «Стоп»
// } from "../services/LiveLocationWatchdog";

// export const registerLiveLocationHandler = (bot: Telegraf<Context>): void => {
//   bot.on(["message", "edited_message"], async (ctx, next): Promise<void> => {
//     const msg: any = ctx.message ?? ctx.editedMessage;
//     console.debug("[LiveLocation] 📥 Incoming update:", JSON.stringify(msg, null, 2));

//     /* 1. Нас интересуют только апдейты с location */
//     if (!msg?.location) {
//       console.debug("[LiveLocation] ❌ No location found. Skipping.");
//       await next();
//       return;
//     }

//     try {
//       /* 2. Определяем пользователя */
//       const telegramId = ctx.from?.id?.toString();
//       if (!telegramId) {
//         console.debug("[LiveLocation] ⚠️ ctx.from.id absent.");
//         await next();
//         return;
//       }

//       const user = await UserModel
//         .findOne({ telegramId })
//         .lean<IUser & { _id: Types.ObjectId }>();
//       if (!user) {
//         console.debug("[LiveLocation] ❌ User not found.");
//         await next();
//         return;
//       }
//       const userId = user._id;
//       console.debug("[LiveLocation] ✅ User found:", userId.toString());

//       /* 3. Watchdog: фиксируем live-sharing */
//       const hasLivePeriod = typeof msg.location.live_period === "number";
//       if (!ctx.editedMessage && hasLivePeriod) {
//         /* первая точка – запускаем watch */
//         startWatch(userId, msg.message_id, msg.date, msg.location.live_period);
//       }
//       updateWatch(userId, hasLivePeriod);

//       /* 4. Сохраняем координату */
//       const { latitude, longitude } = msg.location;
//       await PositionService.savePosition(
//         userId,
//         latitude,
//         longitude,
//         undefined,           // будет заполнено ниже, если запущена сессия
//         undefined
//       );
//       console.debug("[LiveLocation] ✅ Position saved.");

//       /* 5. Живой флаг в FSM */
//       await LiveLocationService.setLiveLocationActive(userId, true);

//       /* 6. Логика задач ─ без изменений */
//       const fsm = await UserSessionStore.getState(userId);

//       let taskId: Types.ObjectId | undefined;
//       let sessionId: Types.ObjectId | undefined;

//       if (fsm?.data?.taskId && Types.ObjectId.isValid(fsm.data.taskId)) {
//         taskId = new Types.ObjectId(fsm.data.taskId);
//         const session = await SessionService.startSession(userId, taskId);
//         sessionId = session._id;
//       }

//       await PositionService.savePosition(
//         userId,
//         latitude,
//         longitude,
//         sessionId,
//         taskId
//       );

//       if (!taskId) {
//         await UserSessionStore.setState(userId, "free_live", {
//           liveLocationActive: true,
//         });
//         if (fsm?.state !== "free_live") {
//           await ctx.reply("📍 Локация получена.");
//         }
//         await next();
//         return;
//       }

//       if (fsm?.state === "awaiting_location") {
//         await TaskService.startTask(userId);
//         await UserSessionStore.setState(userId, "task_in_progress", {
//           taskId,
//           liveLocationActive: true,
//         });

//         const task = await TaskModel.findById(taskId).lean<ITask>();
//         await ctx.reply(
//           `📍 Локация получена. Задача *${
//             task?.title ?? "Без названия"
//           }* начата.`,
//           {
//             parse_mode: "Markdown",
//             ...Markup.inlineKeyboard([
//               [
//                 Markup.button.callback(
//                   "✅ Завершить задачу",
//                   `complete_${taskId}`
//                 ),
//               ],
//             ]),
//           }
//         );
//       } else {
//         await UserSessionStore.setState(userId, "location_received", {
//           taskId,
//           liveLocationActive: true,
//         });
//       }
//     } catch (err) {
//       console.error("[LiveLocation] 🔥 Error occurred:", err);
//       await ctx.reply("Произошла ошибка при обработке локации.");
//     }

//     /* всегда пропускаем дальше, чтобы не ломать цепочку */
//     await next();
//   });
// };
