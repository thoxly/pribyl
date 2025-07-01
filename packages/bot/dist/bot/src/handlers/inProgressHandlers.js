"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInProgressHandlers = registerInProgressHandlers;
const Task_1 = __importDefault(require("../models/Task"));
function registerInProgressHandlers(bot) {
    bot.action(/^finish_(.+)$/, async (ctx) => {
        await ctx.answerCbQuery();
        const userId = ctx.user?._id?.toString();
        const taskId = ctx.match[1];
        const task = await Task_1.default.findOne({ _id: taskId, workerId: userId, status: 'in-progress' });
        if (!task)
            return ctx.reply('Задача не найдена или уже завершена.');
        task.status = 'completed';
        task.completedAt = new Date();
        await task.save();
        await ctx.editMessageText(`✅ Задача *${task.title}* завершена.`, { parse_mode: 'Markdown' });
    });
}
