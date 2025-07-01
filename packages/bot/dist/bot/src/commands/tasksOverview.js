"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasksOverviewCommand = tasksOverviewCommand;
const telegraf_1 = require("telegraf");
const Task_1 = __importDefault(require("../models/Task"));
async function tasksOverviewCommand(ctx) {
    const userId = ctx.user?._id;
    if (!userId) {
        await ctx.reply("Пользователь не найден");
        return;
    }
    const [assigned, completed, overdue, rework] = await Promise.all([
        Task_1.default.find({ workerId: userId, status: "accepted" }).lean(),
        Task_1.default.find({ workerId: userId, status: "completed" }).lean(),
        Task_1.default.find({ workerId: userId, status: "overdue" }).lean(),
        Task_1.default.find({ workerId: userId, status: "needs_rework" }).lean(),
    ]);
    await ctx.reply("📋 Выберите категорию:", telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback(`📥 Назначенные (${assigned.length})`, "view_accepted"),
        telegraf_1.Markup.button.callback(`🔁 На доработку (${rework.length})`, "view_rework"),
        telegraf_1.Markup.button.callback(`✅ Завершённые (${completed.length})`, "view_completed"),
        telegraf_1.Markup.button.callback(`⏰ Просроченные  (${overdue.length})`, "view_overdue"),
    ], { columns: 1 }));
}
