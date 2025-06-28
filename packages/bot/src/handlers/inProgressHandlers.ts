import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context';
import TaskModel from '../models/Task';

export function registerInProgressHandlers(bot: Telegraf<BotContext>): void {
  bot.action(/^finish_(.+)$/, async (ctx: BotContext & { match: RegExpMatchArray }) => {
    await ctx.answerCbQuery();
    const userId = ctx.user?._id?.toString();
    const taskId = ctx.match[1];

    const task = await TaskModel.findOne({ _id: taskId, workerId: userId, status: 'in-progress' });
    if (!task) return ctx.reply('Задача не найдена или уже завершена.');

    task.status = 'completed';
    task.completedAt = new Date();
    await task.save();

    await ctx.editMessageText(`✅ Задача *${task.title}* завершена.`, { parse_mode: 'Markdown' });
  });
}
