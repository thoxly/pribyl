"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAcceptTaskHandler = void 0;
const mongoose_1 = require("mongoose");
const User_1 = __importDefault(require("../models/User"));
const Task_1 = __importDefault(require("../models/Task"));
const TaskService_1 = __importDefault(require("../services/TaskService"));
const UserSessionStore_1 = require("../services/UserSessionStore");
const SessionService_1 = require("../services/SessionService");
const escapeMarkdown_1 = require("../utils/escapeMarkdown");
const Session_1 = __importDefault(require("../models/Session"));
const registerAcceptTaskHandler = (bot) => {
    bot.action(/^accept_(.+)$/i, async (ctx) => {
        try {
            /* --- базовая валидация ------------------------------------------------ */
            const taskIdRaw = ctx.match?.[1];
            if (!taskIdRaw)
                return void ctx.answerCbQuery("Некорректный ID задачи");
            const telegramId = ctx.from?.id?.toString();
            if (!telegramId)
                return void ctx.answerCbQuery("Не удалось идентифицировать");
            const worker = await User_1.default.findOne({ telegramId });
            if (!worker)
                return void ctx.answerCbQuery("Пользователь не найден");
            const userId = worker._id;
            const taskId = new mongoose_1.Types.ObjectId(taskIdRaw);
            /* --- запрет второй активной задачи ----------------------------------- */
            const activeTask = await Task_1.default.findOne({
                workerId: userId,
                status: "in-progress",
            }).lean();
            if (activeTask)
                return void ctx.answerCbQuery("У вас уже есть активная задача");
            /* --- текущее состояние FSM + активность локации ---------------------- */
            const fsm = await UserSessionStore_1.UserSessionStore.getState(userId);
            const liveLocationIsActive = fsm?.data?.liveLocation?.active === true; // ← источник истины
            /* --- открытая сессия (может быть free) ------------------------------- */
            let session = await SessionService_1.SessionService.getActiveSession(userId);
            if (liveLocationIsActive) {
                /* ===== Локация уже идёт — задача стартует мгновенно ================ */
                if (!session) {
                    // теоретически не должно быть, но подстрахуемся
                    session = await SessionService_1.SessionService.startSession(userId, taskId);
                }
                else if (!session.taskId) {
                    // free-сессия → «прикрепляем» задачу
                    await Session_1.default.updateOne({ _id: session._id }, { taskId: taskId });
                }
                else if (String(session.taskId) !== String(taskId)) {
                    // висит другая задача — закрываем и открываем новую с нужным taskId
                    await SessionService_1.SessionService.endSession(session._id);
                    session = await SessionService_1.SessionService.startSession(userId, taskId);
                }
                await TaskService_1.default.startTask(userId);
                await UserSessionStore_1.UserSessionStore.setState(userId, "task_in_progress", {
                    taskId: taskId.toString(),
                    liveLocation: { active: true },
                });
                /* убираем клавиатуру */
                try {
                    await ctx.editMessageReplyMarkup(undefined);
                }
                catch {
                    /* не критично */
                }
                const task = await Task_1.default.findById(taskId).lean();
                if (task) {
                    await ctx.reply(`📍 Вы уже делитесь локацией. Задача *${task.title ?? "Без названия"}* начата.`, {
                        parse_mode: "Markdown",
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "✅ Завершить задачу",
                                        callback_data: `complete_${taskId}`,
                                    },
                                ],
                            ],
                        },
                    });
                }
                await ctx.answerCbQuery("Задача начата");
            }
            else {
                /* ===== Локации нет — ждём первую live-точку ========================= */
                await UserSessionStore_1.UserSessionStore.setState(userId, "awaiting_location", {
                    taskId: taskId.toString(),
                });
                /* логируем попытку без локации (для аналитики) */
                console.info(`[AcceptTask] ${telegramId} нажал "Взять", но локация выключена`);
                try {
                    await ctx.editMessageReplyMarkup(undefined);
                }
                catch {
                    /* ок, если уже нет разметки */
                }
                await ctx.answerCbQuery("Ожидается передача локации");
                await ctx.reply("Чтобы приступить к задаче, поделитесь локацией: 📎 *Прикрепить → Локация → В реальном времени*.", {
                    parse_mode: "Markdown",
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "🔙 Назад", callback_data: "back_to_assigned_task" }],
                        ],
                    },
                });
            }
        }
        catch (e) {
            console.error("[AcceptTask] error:", e);
            await ctx.answerCbQuery("Ошибка, попробуйте позже");
        }
    });
    bot.action("back_to_assigned_task", async (ctx) => {
        console.log("👈 Нажата кнопка back_to_assigned_task");
        try {
            const telegramId = ctx.from?.id?.toString();
            if (!telegramId) {
                await ctx.answerCbQuery("Ошибка идентификации");
                return;
            }
            const worker = await User_1.default.findOne({ telegramId });
            if (!worker) {
                await ctx.answerCbQuery("Пользователь не найден");
                return;
            }
            const fsm = await UserSessionStore_1.UserSessionStore.getState(worker._id);
            const taskId = fsm?.data?.taskId;
            if (!taskId) {
                await ctx.answerCbQuery("Нет сохранённой задачи");
                return;
            }
            const task = await Task_1.default.findById(taskId)
                .populate("createdBy", "fullName")
                .lean();
            if (!task) {
                await ctx.answerCbQuery("Задача не найдена");
                return;
            }
            const fullTask = task;
            await UserSessionStore_1.UserSessionStore.setState(worker._id, "awaiting_task_in_progress", {
                taskId: fullTask._id.toString(),
            });
            const parts = ["🛠 *Вам назначена новая задача*"];
            if (fullTask.title)
                parts.push(`*Название:* ${(0, escapeMarkdown_1.escapeMarkdownV2)(fullTask.title)}`);
            if (fullTask.address)
                parts.push(`*Адрес:* ${(0, escapeMarkdown_1.escapeMarkdownV2)(fullTask.address)}`);
            if (fullTask.dateStart)
                parts.push(`*Начало:* ${(0, escapeMarkdown_1.escapeMarkdownV2)(new Date(fullTask.dateStart).toLocaleString())}`);
            if (fullTask.deadline)
                parts.push(`*Дедлайн:* ${(0, escapeMarkdown_1.escapeMarkdownV2)(new Date(fullTask.deadline).toLocaleString())}`);
            if (fullTask.description)
                parts.push(`*Описание:* ${(0, escapeMarkdown_1.escapeMarkdownV2)(fullTask.description)}`);
            if (fullTask.createdBy?.fullName)
                parts.push(`*Создано:* ${(0, escapeMarkdown_1.escapeMarkdownV2)(fullTask.createdBy.fullName)}`);
            const message = parts.join("\n");
            await ctx.editMessageText(message, {
                parse_mode: "MarkdownV2",
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "✅ Взять в работу",
                                callback_data: `accept_${fullTask._id}`,
                            },
                        ],
                        [
                            {
                                text: "🔙 Вернуться к задачам",
                                callback_data: "back_to_tasks",
                            },
                        ],
                    ],
                },
            });
            await ctx.answerCbQuery();
        }
        catch (err) {
            console.error("Ошибка при возврате к задаче:", err);
            await ctx.answerCbQuery("Ошибка возврата");
        }
    });
};
exports.registerAcceptTaskHandler = registerAcceptTaskHandler;
