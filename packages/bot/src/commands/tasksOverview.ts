import { Markup } from "telegraf";
import { BotContext } from "../types/context";
import TaskModel, { ITask } from "../models/Task";

export async function tasksOverviewCommand(ctx: BotContext): Promise<void> {
  const userId = ctx.user?._id;

  if (!userId) {
    await ctx.reply("Пользователь не найден");
    return;
  }

  const [assigned, completed, overdue, rework] = await Promise.all([
    TaskModel.find({ workerId: userId, status: "accepted" }).lean<ITask[]>(),
    TaskModel.find({ workerId: userId, status: "completed" }).lean<ITask[]>(),
    TaskModel.find({ workerId: userId, status: "overdue" }).lean<ITask[]>(),
    TaskModel.find({ workerId: userId, status: "needs_rework" }).lean<ITask[]>(),
  ]);

  await ctx.reply(
    "📋 Выберите категорию:",
    Markup.inlineKeyboard(
      [
        Markup.button.callback(
          `📥 Назначенные (${assigned.length})`,
          "view_accepted"
        ),
        Markup.button.callback(
          `🔁 На доработку (${rework.length})`,
          "view_rework"
        ),
        Markup.button.callback(
          `✅ Завершённые (${completed.length})`,
          "view_completed"
        ),
        Markup.button.callback(
          `⏰ Просроченные  (${overdue.length})`,
          "view_overdue"
        ),
      ],
      { columns: 1 }
    )
  );
}
