"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inProgressTasksCommand = inProgressTasksCommand;
const telegraf_1 = require("telegraf");
const Task_1 = __importDefault(require("../models/Task"));
async function inProgressTasksCommand(ctx) {
    const userId = ctx.user?._id;
    if (!userId) {
        await ctx.reply('Пользователь не найден');
        return;
    }
    const tasks = await Task_1.default
        .find({ workerId: userId, status: 'in-progress' })
        .lean();
    if (!tasks.length) {
        await ctx.reply('У тебя нет задач в работе.');
        return;
    }
    await ctx.reply(renderTaskList(tasks, '🔧 Сейчас выполняется'), {
        parse_mode: 'Markdown',
        reply_markup: telegraf_1.Markup.inlineKeyboard(tasks.map(t => telegraf_1.Markup.button.callback(`✅ Завершить «${t.title}»`, `finish_${t._id}`)), { columns: 1 }).reply_markup,
    });
}
function formatDate(date) {
    return date ? new Date(date).toLocaleString('ru-RU') : '';
}
function renderTaskList(tasks, title) {
    const lines = tasks.map((t, i) => [
        `${i + 1}. ${t.title}`,
        t.deadline && `⏰ ${formatDate(t.deadline)}`,
        t.description && `📝 ${t.description}`,
    ].filter(Boolean).join('\n'));
    return `${title}\n\n${lines.join('\n\n')}`;
}
