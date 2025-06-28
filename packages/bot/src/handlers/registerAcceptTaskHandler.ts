import { Telegraf, Context } from "telegraf";
import { Types } from "mongoose";
import UserModel from "../models/User";
import TaskModel, { ITask } from "../models/Task";
import TaskService from "../services/TaskService";
import { UserSessionStore } from "../services/UserSessionStore";
import { SessionService } from "../services/SessionService";
import { escapeMarkdownV2 } from "../utils/escapeMarkdown";
import { BotContext } from "src/types/context";
import SessionModel from "../models/Session";

export const registerAcceptTaskHandler = (bot: Telegraf<BotContext>): void => {
  bot.action(/^accept_(.+)$/i, async (ctx): Promise<void> => {
    try {
      /* --- базовая валидация ------------------------------------------------ */
      const taskIdRaw = ctx.match?.[1];
      if (!taskIdRaw) return void ctx.answerCbQuery("Некорректный ID задачи");

      const telegramId = ctx.from?.id?.toString();
      if (!telegramId)
        return void ctx.answerCbQuery("Не удалось идентифицировать");

      const worker = await UserModel.findOne({ telegramId });
      if (!worker) return void ctx.answerCbQuery("Пользователь не найден");

      const userId = worker._id;
      const taskId = new Types.ObjectId(taskIdRaw);

      /* --- запрет второй активной задачи ----------------------------------- */
      const activeTask = await TaskModel.findOne({
        workerId: userId,
        status: "in-progress",
      }).lean();
      if (activeTask)
        return void ctx.answerCbQuery("У вас уже есть активная задача");

      /* --- текущее состояние FSM + активность локации ---------------------- */
      const fsm = await UserSessionStore.getState(userId);
      const liveLocationIsActive = fsm?.data?.liveLocation?.active === true; // ← источник истины

      /* --- открытая сессия (может быть free) ------------------------------- */
      let session = await SessionService.getActiveSession(userId);

      if (liveLocationIsActive) {
        /* ===== Локация уже идёт — задача стартует мгновенно ================ */
        if (!session) {
          // теоретически не должно быть, но подстрахуемся
          session = await SessionService.startSession(userId, taskId);
        } else if (!session.taskId) {
          // free-сессия → «прикрепляем» задачу
          await SessionModel.updateOne(
            { _id: session._id },
            { taskId: taskId }
          );
        } else if (String(session.taskId) !== String(taskId)) {
          // висит другая задача — закрываем и открываем новую с нужным taskId
          await SessionService.endSession(session._id);
          session = await SessionService.startSession(userId, taskId);
        }

        await TaskService.startTask(userId);
        await UserSessionStore.setState(userId, "task_in_progress", {
          taskId: taskId.toString(),
          liveLocation: { active: true },
        });

        /* убираем клавиатуру */
        try {
          await ctx.editMessageReplyMarkup(undefined);
        } catch {
          /* не критично */
        }

        const task = await TaskModel.findById(taskId).lean<ITask>();

        if (task) {
          await ctx.reply(
            `📍 Вы уже делитесь локацией. Задача *${
              task.title ?? "Без названия"
            }* начата.`,
            {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "✅ Завершить задачу",
                      callback_data: `complete_${taskId}`,
                    },
                  ],
                ],
              },
            }
          );
        }

        await ctx.answerCbQuery("Задача начата");
      } else {
        /* ===== Локации нет — ждём первую live-точку ========================= */
        await UserSessionStore.setState(userId, "awaiting_location", {
          taskId: taskId.toString(),
        });

        /* логируем попытку без локации (для аналитики) */
        console.info(
          `[AcceptTask] ${telegramId} нажал "Взять", но локация выключена`
        );

        try {
          await ctx.editMessageReplyMarkup(undefined);
        } catch {
          /* ок, если уже нет разметки */
        }

        await ctx.answerCbQuery("Ожидается передача локации");
        await ctx.reply(
          "Чтобы приступить к задаче, поделитесь локацией: 📎 *Прикрепить → Локация → В реальном времени*.",
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "🔙 Назад", callback_data: "back_to_assigned_task" }],
              ],
            },
          }
        );
      }
    } catch (e) {
      console.error("[AcceptTask] error:", e);
      await ctx.answerCbQuery("Ошибка, попробуйте позже");
    }
  });

  bot.action("back_to_assigned_task", async (ctx): Promise<void> => {
    console.log("👈 Нажата кнопка back_to_assigned_task");

    try {
      const telegramId = ctx.from?.id?.toString();
      if (!telegramId) {
        await ctx.answerCbQuery("Ошибка идентификации");
        return;
      }

      const worker = await UserModel.findOne({ telegramId });
      if (!worker) {
        await ctx.answerCbQuery("Пользователь не найден");
        return;
      }

      const fsm = await UserSessionStore.getState(worker._id);
      const taskId = fsm?.data?.taskId;

      if (!taskId) {
        await ctx.answerCbQuery("Нет сохранённой задачи");
        return;
      }

      const task = await TaskModel.findById(taskId)
        .populate("createdBy", "fullName")
        .lean();

      if (!task) {
        await ctx.answerCbQuery("Задача не найдена");
        return;
      }

      const fullTask = task as unknown as ITask & {
        createdBy?: { fullName?: string };
        _id: Types.ObjectId;
      };

      await UserSessionStore.setState(worker._id, "awaiting_task_in_progress", {
        taskId: fullTask._id.toString(),
      });

      const parts: string[] = ["🛠 *Вам назначена новая задача*"];
      if (fullTask.title)
        parts.push(`*Название:* ${escapeMarkdownV2(fullTask.title)}`);
      if (fullTask.address)
        parts.push(`*Адрес:* ${escapeMarkdownV2(fullTask.address)}`);
      if (fullTask.dateStart)
        parts.push(
          `*Начало:* ${escapeMarkdownV2(
            new Date(fullTask.dateStart).toLocaleString()
          )}`
        );
      if (fullTask.deadline)
        parts.push(
          `*Дедлайн:* ${escapeMarkdownV2(
            new Date(fullTask.deadline).toLocaleString()
          )}`
        );
      if (fullTask.description)
        parts.push(`*Описание:* ${escapeMarkdownV2(fullTask.description)}`);
      if (fullTask.createdBy?.fullName)
        parts.push(
          `*Создано:* ${escapeMarkdownV2(fullTask.createdBy.fullName)}`
        );

      const message = parts.join("\n");

      await ctx.editMessageText(message, {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Взять в работу",
                callback_data: `accept_${fullTask._id}`,
              },
            ],
            [
              {
                text: "🔙 Вернуться к задачам",
                callback_data: "back_to_tasks",
              },
            ],
          ],
        },
      });

      await ctx.answerCbQuery();
    } catch (err) {
      console.error("Ошибка при возврате к задаче:", err);
      await ctx.answerCbQuery("Ошибка возврата");
    }
  });
};
