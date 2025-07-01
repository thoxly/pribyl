"use strict";
// import { Markup } from "telegraf";
// import { BotContext } from "../types/context";
// import TaskModel, { ITask } from "../models/Task";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskCommand = void 0;
// export const taskCommand = async (ctx: BotContext) => {
//   const userId = ctx.user?._id;
//   if (!userId) return ctx.reply("Пользователь не найден");
//   const [accepted, inProgress, overdue, completed] = await Promise.all([
//     TaskModel.find({ workerId: userId, status: "accepted" }).lean<ITask[]>(),
//     TaskModel.find({ workerId: userId, status: "in-progress" }).lean<ITask[]>(),
//     TaskModel.find({ workerId: userId, status: "overdue" }).lean<ITask[]>(),
//     TaskModel.find({ workerId: userId, status: "completed" }).lean<ITask[]>(),
//   ]);
//   // Отображаем сразу задачи в работе
//   if (inProgress.length) {
//     const message = renderTaskList(inProgress, "🔧 Сейчас выполняется");
//     await ctx.reply(message);
//   }
//   const buttons = [
//     Markup.button.callback(
//       `📥 Назначенные (${accepted.length})`,
//       "view_accepted"
//     ),
//     Markup.button.callback(
//       `✅ Завершённые (${completed.length})`,
//       "view_completed"
//     ),
//     Markup.button.callback(
//       `⏰ Просроченные задачи (${overdue.length})`,
//       "view_overdue"
//     ),
//   ];
//   await ctx.reply(
//     "📋 Ваши задачи:",
//     Markup.inlineKeyboard(buttons, { columns: 1 })
//   );
// };
// function formatDate(date?: Date): string {
//   return date ? new Date(date).toLocaleString("ru-RU") : "";
// }
// function renderTaskList(tasks: ITask[], title: string): string {
//   const lines = tasks.map((task, index) => {
//     const parts: string[] = [];
//     parts.push(`${index + 1}. ${task.title}`);
//     if (task.address) {
//       parts.push(`📍 Адрес: ${task.address}`);
//     }
//     if (task.dateStart) {
//       parts.push(`🚀 Начало: ${formatDate(task.dateStart)}`);
//     }
//     if (task.deadline) {
//       parts.push(`⏰ Дедлайн: ${formatDate(task.deadline)}`);
//     }
//     if (task.description) {
//       parts.push(`📝 Описание: ${task.description}`);
//     }
//     return parts.join("\n");
//   });
//   return `${title}:\n\n${lines.join("\n\n")}`;
// }
const telegraf_1 = require("telegraf");
const Task_1 = __importDefault(require("../models/Task"));
const taskCommand = async (ctx) => {
    const userId = ctx.user?._id;
    if (!userId) {
        console.warn("[taskCommand] Пользователь не найден");
        await ctx.reply("Пользователь не найден");
        return;
    }
    const [accepted, inProgress, overdue, completed] = await Promise.all([
        Task_1.default.find({ workerId: userId, status: "accepted" }).lean(),
        Task_1.default.find({ workerId: userId, status: "in-progress" }).lean(),
        Task_1.default.find({ workerId: userId, status: "overdue" }).lean(),
        Task_1.default.find({ workerId: userId, status: "completed" }).lean(),
    ]);
    console.debug(`[taskCommand] accepted: ${accepted.length}`);
    console.debug(`[taskCommand] inProgress: ${inProgress.length}`);
    console.debug(`[taskCommand] overdue: ${overdue.length}`);
    console.debug(`[taskCommand] completed: ${completed.length}`);
    if (inProgress.length) {
        const message = renderTaskList(inProgress, "🔧 Сейчас выполняется");
        console.debug("[taskCommand] Отправка задач в работе");
        await ctx.reply(message);
    }
    const buttons = [
        [telegraf_1.Markup.button.callback(`📥 Назначенные (${accepted.length})`, "view_accepted")],
        [telegraf_1.Markup.button.callback(`✅ Завершённые (${completed.length})`, "view_completed")],
        [telegraf_1.Markup.button.callback(`⏰ Просроченные задачи (${overdue.length})`, "view_overdue")],
    ];
    console.debug("[taskCommand] Кнопки:", buttons.map(row => row.map(b => b.text)).flat());
    await ctx.reply("📋 Ваши задачи:", telegraf_1.Markup.inlineKeyboard(buttons));
};
exports.taskCommand = taskCommand;
function formatDate(date) {
    return date ? new Date(date).toLocaleString("ru-RU") : "";
}
function renderTaskList(tasks, title) {
    const lines = tasks.map((task, index) => {
        const parts = [];
        parts.push(`${index + 1}. ${task.title}`);
        if (task.address) {
            parts.push(`📍 Адрес: ${task.address}`);
        }
        if (task.dateStart) {
            parts.push(`🚀 Начало: ${formatDate(task.dateStart)}`);
        }
        if (task.deadline) {
            parts.push(`⏰ Дедлайн: ${formatDate(task.deadline)}`);
        }
        if (task.description) {
            parts.push(`📝 Описание: ${task.description}`);
        }
        return parts.join("\n");
    });
    return `${title}:\n\n${lines.join("\n\n")}`;
}
