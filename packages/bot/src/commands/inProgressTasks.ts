import { Markup } from 'telegraf';
import { BotContext } from '../types/context';
import TaskModel, { ITask } from '../models/Task';

export async function inProgressTasksCommand(ctx: BotContext): Promise<void> {
  const userId = ctx.user?._id;
  if (!userId) {
    await ctx.reply('Пользователь не найден');
    return;
  }

  const tasks = await TaskModel
    .find({ workerId: userId, status: 'in-progress' })
    .lean<ITask[]>();

  if (!tasks.length) {
    await ctx.reply('У тебя нет задач в работе.');
    return;
  }

  await ctx.reply(renderTaskList(tasks, '🔧 Сейчас выполняется'), {
    parse_mode: 'Markdown',
    reply_markup: Markup.inlineKeyboard(
      tasks.map(t =>
        Markup.button.callback(`✅ Завершить «${t.title}»`, `finish_${t._id}`),
      ),
      { columns: 1 },
    ).reply_markup,
  });
}

function formatDate(date?: Date) {
  return date ? new Date(date).toLocaleString('ru-RU') : '';
}

function renderTaskList(tasks: ITask[], title: string): string {
  const lines = tasks.map((t, i) => [
    `${i + 1}. ${t.title}`,
    t.deadline && `⏰ ${formatDate(t.deadline)}`,
    t.description && `📝 ${t.description}`,
  ].filter(Boolean).join('\n'));

  return `${title}\n\n${lines.join('\n\n')}`;
}
