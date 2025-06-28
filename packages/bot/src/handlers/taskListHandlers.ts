import { Telegraf, Markup } from "telegraf";
import { BotContext } from "../types/context";
import TaskModel, { ITask } from "../models/Task";
import { getCallbackData } from "../utils/getCallbackData";
import { UserSessionStore } from "../services/UserSessionStore";

const cache = new Map<string, ITask[]>();

export function registerTaskListHandlers(bot: Telegraf<BotContext>): void {
  bot.action(["view_accepted", "view_completed", "view_overdue"], listHandler);
  bot.action(/^task_select_(\d+)$/, detailsHandler);
  bot.action("back_to_last_list", backToListHandler);
  bot.action("back_to_tasks", backToMenuHandler);

}

async function listHandler(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery();

  const userId = ctx.user?._id;
  if (!userId) return;

  const state = await UserSessionStore.getState(userId);
  const preservedData = state?.data?.liveLocation?.active
    ? { liveLocation: state.data.liveLocation }
    : {};

  await UserSessionStore.setState(userId, "viewing_task_list", preservedData);

  const data = getCallbackData(ctx);
  if (!data) return;

  const statusMap = {
    view_accepted: "accepted",
    view_completed: "completed",
    view_overdue: "overdue",
  } as const;

  const status = statusMap[data as keyof typeof statusMap];
  if (!status) return;


  const title =
    status === "accepted"
      ? "📥 Назначенные задачи:"
      : status === "completed"
      ? "✅ Завершённые задачи:"
      : "⏰ Просроченные задачи:";

  const tasks = await TaskModel.find({ workerId: userId, status }).lean<
    ITask[]
  >();

  if (!tasks.length) {
    await ctx.editMessageText(
      `Нет ${
        status === "accepted"
          ? "назначенных"
          : status === "completed"
          ? "завершённых"
          : "просроченных"
      } задач.`,
      {
        reply_markup: Markup.inlineKeyboard([
          Markup.button.callback("🔙 Назад", "back_to_tasks"),
        ]).reply_markup,
      }
    );
    return;
  }
  cache.set(userId.toString(), tasks);

  await ctx.editMessageText(renderTaskList(tasks, title), {
    parse_mode: "Markdown",
    reply_markup: Markup.inlineKeyboard(
      [
        ...tasks.map((_, i) =>
          Markup.button.callback(`${i + 1}`, `task_select_${i}`)
        ),
        Markup.button.callback("🔙 Назад", "back_to_tasks"),
      ],
      { columns: 4 }
    ).reply_markup,
  });
}

async function detailsHandler(ctx: BotContext & { match: RegExpMatchArray }) {
  await ctx.answerCbQuery();

  const userId = ctx.user?._id;
  if (!userId) return;

  const state = await UserSessionStore.getState(userId);
  const preservedData = state?.data?.liveLocation?.active
    ? { liveLocation: state.data.liveLocation }
    : {};

  await UserSessionStore.setState(
    userId,
    "viewing_task_details",
    preservedData
  );

  const list = cache.get(userId.toString());
  const task = list?.[Number(ctx.match[1])];

  if (!task) {
    await ctx.editMessageText("Задача не найдена.");
    return;
  }

  await ctx.editMessageText(renderTaskDetails(task), {
    parse_mode: "Markdown",
    reply_markup: Markup.inlineKeyboard([
      Markup.button.callback("🔙 Назад", "back_to_last_list"),
    ]).reply_markup,
  });
}

async function backToListHandler(ctx: BotContext) {
  await ctx.answerCbQuery();

  const userId = ctx.user?._id;
  if (!userId) return;

  const tasks = cache.get(userId.toString());
  if (!tasks?.length) return;

  const state = await UserSessionStore.getState(userId);
  const preservedData = state?.data?.liveLocation?.active
    ? { liveLocation: state.data.liveLocation }
    : {};

  await UserSessionStore.setState(userId, "viewing_task_list", preservedData);

  const title =
    tasks[0].status === "accepted"
      ? "📥 Назначенные задачи:"
      : tasks[0].status === "completed"
      ? "✅ Завершённые задачи:"
      : "⏰ Просроченные задачи:";

  await ctx.editMessageText(renderTaskList(tasks, title), {
    parse_mode: "Markdown",
    reply_markup: Markup.inlineKeyboard(
      [
        ...tasks.map((_, i) =>
          Markup.button.callback(`${i + 1}`, `task_select_${i}`)
        ),
        Markup.button.callback("🔙 Назад", "back_to_tasks"),
      ],
      { columns: 4 }
    ).reply_markup,
  });
}

async function backToMenuHandler(ctx: BotContext) {
  console.log("[BackToMenu] Показываем главное меню задач");

  await ctx.answerCbQuery();

  const userId = ctx.user?._id;
  if (userId) {
    const state = await UserSessionStore.getState(userId);
    const preservedData = state?.data?.liveLocation?.active
      ? { liveLocation: state.data.liveLocation }
      : {};
    await UserSessionStore.setState(userId, "main_task_menu", preservedData);
  }

  await ctx.deleteMessage();

  await ctx.telegram.sendMessage(ctx.chat!.id, "📋 Ваши задачи:", {
    reply_markup: Markup.inlineKeyboard(
      [
        Markup.button.callback("📥 Назначенные", "view_accepted"),
        Markup.button.callback("⏰ Просроченные", "view_overdue"),
        Markup.button.callback("✅ Завершённые", "view_completed"),
      ],
      { columns: 1 }
    ).reply_markup,
  });
}

function formatDate(date?: Date) {
  return date ? new Date(date).toLocaleString("ru-RU") : "";
}

function renderTaskList(tasks: ITask[], title: string): string {
  const lines = tasks.map((t, i) =>
    [
      `*${i + 1}.* ${t.title}`,
      t.address && `📍 ${t.address}`,
      t.dateStart && `🚀 ${formatDate(t.dateStart)}`,
      t.deadline && `⏰ ${formatDate(t.deadline)}`,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return `${title}\n\n${lines.join("\n\n")}`;
}

function renderTaskDetails(task: ITask): string {
  return [
    `📌 *${task.title}*`,
    task.address && `📍 Адрес: ${task.address}`,
    task.dateStart && `🚀 Начало: ${formatDate(task.dateStart)}`,
    task.deadline && `⏰ Дедлайн: ${formatDate(task.deadline)}`,
    task.description && `📝 Описание: ${task.description}`,
  ]
    .filter(Boolean)
    .join("\n");
}
