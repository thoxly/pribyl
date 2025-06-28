import { bot } from "../";
import UserModel, { IUser } from "../models/User";
import TaskModel, { ITask } from "../models/Task";
import { escapeMarkdownV2 } from "../utils/escapeMarkdown";
import { UserSessionStore } from "../services/UserSessionStore";
import { Types } from "mongoose";

export const sendTaskToWorker = async (taskInput: ITask): Promise<void> => {
  try {
    if (!taskInput.workerId || !taskInput.company) {
      console.warn(`Задача ${taskInput._id} не содержит workerId или company`);
      return;
    }

    const task = await TaskModel.findById(taskInput._id)
      .populate("createdBy", "fullName")
      .lean<ITask & { createdBy?: { fullName?: string }; _id: Types.ObjectId }>();

    if (!task) {
      console.warn(`Задача ${taskInput._id} не найдена`);
      return;
    }

    if (!task.company) {
      console.warn(`Задача ${task._id} не содержит company`);
      return;
    }

    const worker = await UserModel.findById(task.workerId).lean<IUser>();
    if (!worker?.telegramId) {
      console.warn(`Пользователь ${task.workerId} не найден или не привязан Telegram`);
      return;
    }

    if (!worker.company || worker.company.toString() !== task.company.toString()) {
      console.warn(`Пользователь ${worker._id} не принадлежит компании задачи`);
      return;
        }


    await UserSessionStore.setState(worker._id, "awaiting_task_in_progress", {
      taskId: task._id.toString(),
    });


    const parts: string[] = ["🛠 *Вам назначена новая задача*"];
    if (task.title) parts.push(`*Название:* ${escapeMarkdownV2(task.title)}`);
    if (task.address) parts.push(`*Адрес:* ${escapeMarkdownV2(task.address)}`);
    if (task.dateStart) parts.push(`*Начало:* ${escapeMarkdownV2(new Date(task.dateStart).toLocaleString())}`);
    if (task.deadline) parts.push(`*Дедлайн:* ${escapeMarkdownV2(new Date(task.deadline).toLocaleString())}`);
    if (task.description) parts.push(`*Описание:* ${escapeMarkdownV2(task.description)}`);
    if (task.createdBy?.fullName) parts.push(`*Создано:* ${escapeMarkdownV2(task.createdBy.fullName)}`);

    const message = parts.join("\n");

    await bot.telegram.sendMessage(worker.telegramId, message, {
      parse_mode: "MarkdownV2",
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Взять в работу", callback_data: `accept_${task._id}` }],
          [{ text: "🔙 Вернуться к списку задач", callback_data: "back_to_assigned_task" }],
        ],
      },
    });
  } catch (err) {
    console.error("Ошибка при отправке задачи воркеру:", err);
  }
};
