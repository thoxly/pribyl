"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTaskListHandlers = registerTaskListHandlers;
const telegraf_1 = require("telegraf");
const Task_1 = __importDefault(require("../models/Task"));
const getCallbackData_1 = require("../utils/getCallbackData");
const UserSessionStore_1 = require("../services/UserSessionStore");
const tasksOverview_1 = require("../commands/tasksOverview");
const cache = new Map();
function registerTaskListHandlers(bot) {
    bot.action(["view_accepted", "view_rework", "view_completed", "view_overdue"], listHandler);
    bot.action(/^task_select_(\d+)$/, detailsHandler);
    bot.action("back_to_last_list", backToListHandler);
    bot.action("back_to_tasks", backToMenuHandler);
}
async function listHandler(ctx) {
    await ctx.answerCbQuery();
    const userId = ctx.user?._id;
    if (!userId)
        return;
    const state = await UserSessionStore_1.UserSessionStore.getState(userId);
    const preservedData = state?.data?.liveLocation?.active
        ? { liveLocation: state.data.liveLocation }
        : {};
    await UserSessionStore_1.UserSessionStore.setState(userId, "viewing_task_list", preservedData);
    const data = (0, getCallbackData_1.getCallbackData)(ctx);
    if (!data)
        return;
    const statusMap = {
        view_accepted: "accepted",
        view_rework: "needs_rework",
        view_completed: "completed",
        view_overdue: "overdue",
    };
    const status = statusMap[data];
    if (!status)
        return;
    const title = status === "accepted"
        ? "📥 Назначенные задачи:"
        : status === "needs_rework"
            ? "🔁 Задачи на доработку:"
            : status === "completed"
                ? "✅ Завершённые задачи:"
                : "⏰ Просроченные задачи:";
    const tasks = await Task_1.default.find({ workerId: userId, status }).lean();
    if (!tasks.length) {
        await ctx.editMessageText(`Нет ${status === "accepted"
            ? "назначенных"
            : status === "completed"
                ? "завершённых"
                : "просроченных"} задач.`, {
            reply_markup: telegraf_1.Markup.inlineKeyboard([
                telegraf_1.Markup.button.callback("🔙 Назад", "back_to_tasks"),
            ]).reply_markup,
        });
        return;
    }
    cache.set(userId.toString(), tasks);
    await ctx.editMessageText(renderTaskList(tasks, title), {
        parse_mode: "Markdown",
        reply_markup: telegraf_1.Markup.inlineKeyboard([
            ...tasks.map((_, i) => telegraf_1.Markup.button.callback(`${i + 1}`, `task_select_${i}`)),
            telegraf_1.Markup.button.callback("🔙 Назад", "back_to_tasks"),
        ], { columns: 4 }).reply_markup,
    });
}
async function detailsHandler(ctx) {
    await ctx.answerCbQuery();
    const userId = ctx.user?._id;
    if (!userId)
        return;
    const state = await UserSessionStore_1.UserSessionStore.getState(userId);
    const preservedData = state?.data?.liveLocation?.active
        ? { liveLocation: state.data.liveLocation }
        : {};
    await UserSessionStore_1.UserSessionStore.setState(userId, "viewing_task_details", preservedData);
    const list = cache.get(userId.toString());
    const task = list?.[Number(ctx.match[1])];
    if (!task) {
        await ctx.editMessageText("Задача не найдена.");
        return;
    }
    const buttons = task.status === "needs_rework"
        ? [
            [telegraf_1.Markup.button.callback("✅ Подтвердить", `complete_${task._id}`)],
            [
                telegraf_1.Markup.button.callback("⏮ Назад", "back_to_last_list"),
                telegraf_1.Markup.button.callback("⏭ Без отчёта", `finish_noreport_${task._id}`),
            ],
        ]
        : [[telegraf_1.Markup.button.callback("🔙 Назад", "back_to_last_list")]];
    await ctx.editMessageText(renderTaskDetails(task), {
        parse_mode: "Markdown",
        reply_markup: telegraf_1.Markup.inlineKeyboard(buttons).reply_markup,
    });
}
async function backToListHandler(ctx) {
    await ctx.answerCbQuery();
    const userId = ctx.user?._id;
    if (!userId)
        return;
    const tasks = cache.get(userId.toString());
    if (!tasks?.length)
        return;
    const state = await UserSessionStore_1.UserSessionStore.getState(userId);
    const preservedData = state?.data?.liveLocation?.active
        ? { liveLocation: state.data.liveLocation }
        : {};
    await UserSessionStore_1.UserSessionStore.setState(userId, "viewing_task_list", preservedData);
    const title = tasks[0].status === "accepted"
        ? "📥 Назначенные задачи:"
        : tasks[0].status === "needs_rework"
            ? "🔁 Задачи на доработку:"
            : tasks[0].status === "completed"
                ? "✅ Завершённые задачи:"
                : "⏰ Просроченные задачи:";
    await ctx.editMessageText(renderTaskList(tasks, title), {
        parse_mode: "Markdown",
        reply_markup: telegraf_1.Markup.inlineKeyboard([
            ...tasks.map((_, i) => telegraf_1.Markup.button.callback(`${i + 1}`, `task_select_${i}`)),
            telegraf_1.Markup.button.callback("🔙 Назад", "back_to_tasks"),
        ], { columns: 4 }).reply_markup,
    });
}
async function backToMenuHandler(ctx) {
    console.log("[BackToMenu] Показываем главное меню задач");
    await ctx.answerCbQuery();
    const userId = ctx.user?._id;
    if (userId) {
        const state = await UserSessionStore_1.UserSessionStore.getState(userId);
        const preservedData = state?.data?.liveLocation?.active
            ? { liveLocation: state.data.liveLocation }
            : {};
        await UserSessionStore_1.UserSessionStore.setState(userId, "main_task_menu", preservedData);
    }
    await ctx.deleteMessage();
    await (0, tasksOverview_1.tasksOverviewCommand)(ctx);
}
function formatDate(date) {
    return date ? new Date(date).toLocaleString("ru-RU") : "";
}
function renderTaskList(tasks, title) {
    const lines = tasks.map((t, i) => [
        `*${i + 1}.* ${t.title}`,
        t.address && `📍 ${t.address}`,
        t.dateStart && `🚀 ${formatDate(t.dateStart)}`,
        t.deadline && `⏰ ${formatDate(t.deadline)}`,
    ]
        .filter(Boolean)
        .join("\n"));
    return `${title}\n\n${lines.join("\n\n")}`;
}
function renderTaskDetails(task) {
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
