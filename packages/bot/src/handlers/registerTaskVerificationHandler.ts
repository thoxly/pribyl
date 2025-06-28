import { Telegraf, Context } from "telegraf";
import { Types } from "mongoose";
import TaskModel, { ITask } from "../models/Task";
import UserModel, { IUser } from "../models/User";
import TaskService from "../services/TaskService";

type TgCtx = Context & { message: any; editedMessage: any };

export const registerTaskVerificationHandler = (bot: Telegraf<TgCtx>): void => {
  console.log("Registering task verification handler");

  // ✅ Согласовать задачу
  bot.action(/^approve_task_(.+)$/, async (ctx): Promise<void> => {
    console.log("Action: approve task triggered", {
      action: ctx.match[0],
      taskId: ctx.match[1],
    });
    const taskIdStr = ctx.match[1];
    if (!Types.ObjectId.isValid(taskIdStr)) {
      console.error("Invalid taskId", { taskIdStr });
      return;
    }

    const taskId = new Types.ObjectId(taskIdStr);
    const task = await TaskModel.findById(taskId).lean<ITask>();
    if (!task) {
      console.error("Task not found", { taskId: taskIdStr });
      return;
    }

    const worker = task.workerId
      ? await UserModel.findById(task.workerId).lean<IUser>()
      : null;

    const managerTelegramId = ctx.from?.id?.toString();

    await TaskService.doneTask(taskId);
    console.log("Task status updated to done");

    // Уведомление исполнителю
    if (worker?.telegramId) {
      await bot.telegram.sendMessage(
        worker.telegramId,
        `✅ Ваша задача *${task.title}* принята руководителем.`,
        { parse_mode: "Markdown" }
      );
      console.log("Worker notified");
    }

    // Уведомление менеджеру
    if (managerTelegramId) {
      await ctx.reply(`✅ Задача *${task.title}* принята.`, {
        parse_mode: "Markdown",
      });
    }
  });

  // 🔁 Отправить задачу на доработку
  bot.action(/^reject_task_(.+)$/, async (ctx): Promise<void> => {
    console.log("Action: reject task triggered", {
      action: ctx.match[0],
      taskId: ctx.match[1],
    });
    const taskIdStr = ctx.match[1];
    if (!Types.ObjectId.isValid(taskIdStr)) {
      console.error("Invalid taskId", { taskIdStr });
      return;
    }

    const taskId = new Types.ObjectId(taskIdStr);
    const task = await TaskModel.findById(taskId).lean<ITask>();
    if (!task) {
      console.error("Task not found", { taskId: taskIdStr });
      return;
    }

    const worker = task.workerId
      ? await UserModel.findById(task.workerId).lean<IUser>()
      : null;

    const managerTelegramId = ctx.from?.id?.toString();

    await TaskService.rejectTask(taskId);
    console.log("Task status updated to needs_rework");

    // Уведомление исполнителю
    if (worker?.telegramId) {
      await bot.telegram.sendMessage(
        worker.telegramId,
        `🔁 Ваша задача *${task.title}* отправлена на доработку руководителем.`,
        { parse_mode: "Markdown" }
      );
      console.log("Worker notified");
    }

    // Уведомление менеджеру
    if (managerTelegramId) {
      await ctx.reply(`🔁 Задача *${task.title}* отправлена на доработку.`, {
        parse_mode: "Markdown",
      });
      console.log("Manager message edited");
    }
  });
};

export default registerTaskVerificationHandler;
