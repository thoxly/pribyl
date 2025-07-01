"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCompleteTaskHandler = void 0;
const telegraf_1 = require("telegraf");
const mongoose_1 = require("mongoose");
const Task_1 = __importDefault(require("../models/Task"));
const User_1 = __importDefault(require("../models/User"));
const Report_1 = __importDefault(require("../models/Report"));
const ReportServive_1 = __importDefault(require("../services/ReportServive"));
const TaskService_1 = __importDefault(require("../services/TaskService"));
const UserSessionStore_1 = require("../services/UserSessionStore");
function formatReportMessages(messages) {
    const parts = [];
    for (const msg of messages) {
        if (msg.type === "text") {
            parts.push(msg.content);
        }
        else if (msg.type === "photo") {
            parts.push(`📷 Фото: https://t.me/c/${msg.telegramMessageId}`);
        }
    }
    return parts.join("\n\n");
}
const registerCompleteTaskHandler = (bot) => {
    console.log("Registering complete task handler");
    // 1️⃣ Нажата «✅ Завершить задачу»
    bot.action(/^complete_(.+)$/, async (ctx) => {
        console.log("Action: complete task triggered", {
            action: ctx.match[0],
            taskId: ctx.match[1],
        });
        const taskIdStr = ctx.match[1];
        if (!mongoose_1.Types.ObjectId.isValid(taskIdStr)) {
            console.error("Invalid taskId", { taskIdStr });
            return;
        }
        const telegramId = ctx.from?.id?.toString();
        if (!telegramId) {
            console.error("No telegramId found");
            return;
        }
        console.log("Processing for user", { telegramId });
        const user = await User_1.default.findOne({ telegramId }).lean();
        if (!user) {
            console.error("User not found", { telegramId });
            return;
        }
        const userId = user._id;
        console.log("User found", { userId: userId.toString() });
        const taskId = new mongoose_1.Types.ObjectId(taskIdStr);
        console.log("Creating or fetching report draft", {
            taskId: taskIdStr,
            userId: userId.toString(),
        });
        const report = (await ReportServive_1.default.getOrCreateDraft(taskId, userId));
        console.log("Report draft obtained", { reportId: report._id.toString() });
        console.log("Setting user session state to awaiting_report", {
            userId: userId.toString(),
        });
        await UserSessionStore_1.UserSessionStore.setState(userId, "awaiting_report", {
            taskId: taskIdStr,
            reportId: report._id.toString(),
        });
        console.log("Editing message reply markup");
        await ctx.editMessageReplyMarkup(undefined);
        console.log("Sending reply for report input");
        await ctx.reply("✏️ Напиши отчёт и/или пришли фото (можно несколько). " +
            "Когда закончишь — нажми *«Подтвердить»*.\n\n" +
            "Если отчёт не нужен, нажми *«Без отчёта»*.", {
            parse_mode: "Markdown",
            ...telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback("✅ Подтвердить", `finish_${report._id}`)],
                [
                    telegraf_1.Markup.button.callback("⏮ Назад", `cancel_complete_${taskIdStr}`),
                    telegraf_1.Markup.button.callback("⏭ Без отчёта", `finish_noreport_${taskIdStr}`),
                ],
            ]),
        });
        console.log("Reply sent successfully");
    });
    // 2️⃣ Приём текста / фото, пока state: awaiting_report
    bot.on(["message", "edited_message"], async (ctx, next) => {
        console.log("Message or edited message received", {
            event: ctx.message ? "message" : "edited_message",
        });
        const telegramId = ctx.from?.id?.toString();
        if (!telegramId) {
            console.error("No telegramId found in message");
            return void next();
        }
        console.log("Processing message for user", { telegramId });
        const user = await User_1.default.findOne({ telegramId }).lean();
        if (!user) {
            console.error("User not found", { telegramId });
            return void next();
        }
        const userId = user._id;
        console.log("User found", { userId: userId.toString() });
        const fsm = await UserSessionStore_1.UserSessionStore.getState(userId);
        console.log("Current user state", { state: fsm?.state, data: fsm?.data });
        if (fsm?.state !== "awaiting_report") {
            console.log("Not in awaiting_report state, skipping");
            return void next();
        }
        const { taskId, reportId: sessionReportId } = fsm.data ?? {};
        if (typeof taskId !== "string" || !mongoose_1.Types.ObjectId.isValid(taskId)) {
            console.error("Invalid or missing taskId in FSM", { taskId });
            return void next();
        }
        const taskObjectId = new mongoose_1.Types.ObjectId(taskId);
        // Попробуем взять reportId из FSM, иначе — достанем из базы
        let reportId = null;
        if (typeof sessionReportId === "string" &&
            mongoose_1.Types.ObjectId.isValid(sessionReportId)) {
            reportId = new mongoose_1.Types.ObjectId(sessionReportId);
        }
        else {
            console.warn("No reportId in FSM — trying to fetch from DB", { taskId });
            reportId = await ReportServive_1.default.getReportIdByTaskId(taskObjectId, userId);
            if (!reportId) {
                console.error("Report not found for given task/user", {
                    taskId,
                    userId,
                });
                return void next();
            }
        }
        if (!mongoose_1.Types.ObjectId.isValid(taskId) || !mongoose_1.Types.ObjectId.isValid(reportId)) {
            console.error("Invalid ObjectId format", { taskId, reportId });
            return void next();
        }
        const msg = ctx.message ?? ctx.editedMessage;
        if (msg?.text) {
            console.log("Appending text to report", {
                reportId,
                textLength: msg.text.length,
                messageId: msg.message_id,
            });
            await ReportServive_1.default.appendText(new mongoose_1.Types.ObjectId(reportId), msg.text, msg.message_id);
            console.log("Text appended successfully");
        }
        else if (msg?.photo?.length) {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            console.log("Appending photo to report", {
                reportId,
                fileId,
                messageId: msg.message_id,
            });
            await ReportServive_1.default.appendPhoto(new mongoose_1.Types.ObjectId(reportId), fileId, msg.message_id);
            console.log("Photo appended successfully");
            if (msg.caption && typeof msg.caption === "string") {
                console.log("Appending caption as text", {
                    reportId,
                    textLength: msg.caption.length,
                    messageId: msg.message_id,
                });
                await ReportServive_1.default.appendText(new mongoose_1.Types.ObjectId(reportId), msg.caption, msg.message_id);
                console.log("Caption appended successfully");
            }
        }
        else {
            console.log("No text or photo in message, skipping");
        }
        await next();
    });
    // 3️⃣ «⏮ Назад» → возвращаемся в task_in_progress
    bot.action(/^cancel_complete_(.+)$/, async (ctx) => {
        console.log("Action: cancel complete triggered", {
            action: ctx.match[0],
            taskId: ctx.match[1],
        });
        const taskIdStr = ctx.match[1];
        if (!taskIdStr) {
            console.error("No taskId provided");
            return;
        }
        const telegramId = ctx.from?.id?.toString();
        if (!telegramId) {
            console.error("No telegramId found");
            return;
        }
        console.log("Processing for user", { telegramId });
        const user = await User_1.default.findOne({ telegramId }).lean();
        if (!user) {
            console.error("User not found", { telegramId });
            return;
        }
        const userId = user._id;
        console.log("User found", { userId: userId.toString() });
        const taskId = new mongoose_1.Types.ObjectId(taskIdStr);
        console.log("Returning task to in_progress", { taskId: taskIdStr });
        await TaskService_1.default.returnTaskToInProgress(userId, taskId);
        console.log("Setting user session state to task_in_progress", {
            userId: userId.toString(),
        });
        await UserSessionStore_1.UserSessionStore.setState(userId, "task_in_progress", {
            taskId: taskIdStr,
            liveLocation: { active: true },
        });
        console.log("Editing message reply markup");
        await ctx.editMessageReplyMarkup(undefined);
        console.log("Sending cancellation reply");
        await ctx.reply("⏮ Отчёт отменён, задача снова *в работе*.", {
            parse_mode: "Markdown",
        });
        console.log("Cancellation reply sent");
    });
    // 4️⃣ «⏭ Без отчёта» → сразу completed
    bot.action(/^finish_noreport_(.+)$/, async (ctx) => {
        console.log("Action: finish without report triggered", {
            action: ctx.match[0],
            taskId: ctx.match[1],
        });
        const taskIdStr = ctx.match[1];
        if (!taskIdStr || !mongoose_1.Types.ObjectId.isValid(taskIdStr)) {
            console.error("Invalid or missing taskId", { taskIdStr });
            return;
        }
        const telegramId = ctx.from?.id?.toString();
        if (!telegramId) {
            console.error("No telegramId found");
            return;
        }
        console.log("Processing for user", { telegramId });
        const user = await User_1.default.findOne({ telegramId }).lean();
        if (!user) {
            console.error("User not found", { telegramId });
            return;
        }
        const userId = user._id;
        // const taskId = task?._id;
        console.log("User found", { userId: userId.toString() });
        console.log("Completing task without report", { taskId: taskIdStr });
        await TaskService_1.default.completeTask(userId, new mongoose_1.Types.ObjectId(taskIdStr));
        // const task = await TaskModel.findById(taskId).lean<ITask>();
        // if (task?.requiresVerification) {
        //   const worker = await UserModel.findById(userId).lean<IUser>();
        //   const managerId = worker?.manager;
        //   if (managerId) {
        //     const manager = await UserModel.findById(managerId).lean<IUser>();
        //     if (manager?.telegramId) {
        //       await bot.telegram.sendMessage(
        //         manager.telegramId,
        //         `📥 Новый отчёт по задаче *${task.title}* от подчинённого. Проверьте и подтвердите.`,
        //         Markup.inlineKeyboard([
        //           Markup.button.callback(
        //             "✅ Согласовать",
        //             `approve_task_${task._id}`
        //           ),
        //           Markup.button.callback(
        //             "🔁 На доработку",
        //             `reject_task_${task._id}`
        //           ),
        //         ])
        //       );
        //     }
        //   }
        // }
        console.log("Setting user session state to task_completed_waiting", {
            userId: userId.toString(),
        });
        await UserSessionStore_1.UserSessionStore.setState(userId, "task_completed_waiting", {
            taskId: taskIdStr,
        });
        console.log("Editing message reply markup");
        await ctx.editMessageReplyMarkup(undefined);
        console.log("Sending completion reply");
        await ctx.reply("🎉 Задача завершена *без отчёта* и ожидает проверки руководителя.", {
            parse_mode: "Markdown",
        });
        console.log("Completion reply sent");
    });
    // 5️⃣ «✅ Подтвердить» → финализируем отчёт + completed
    bot.action(/^finish_(.+)$/, async (ctx) => {
        console.log("Action: finish report triggered", {
            action: ctx.match[0],
            reportId: ctx.match[1],
        });
        const reportIdStr = ctx.match[1];
        if (!reportIdStr || !mongoose_1.Types.ObjectId.isValid(reportIdStr)) {
            console.error("Invalid or missing reportId", { reportIdStr });
            return;
        }
        const telegramId = ctx.from?.id?.toString();
        if (!telegramId) {
            console.error("No telegramId found");
            return;
        }
        console.log("Processing for user", { telegramId });
        const reportId = new mongoose_1.Types.ObjectId(reportIdStr);
        const report = await Report_1.default.findById(reportId).lean();
        if (!report) {
            console.error("Report not found", { reportId: reportIdStr });
            return;
        }
        console.log("Report found", {
            reportId: reportIdStr,
            userId: report.userId.toString(),
            taskId: report.taskId.toString(),
        });
        const userId = report.userId;
        const taskId = report.taskId;
        console.log("Finalizing report", { reportId: reportIdStr });
        await ReportServive_1.default.finalize(reportId);
        console.log("Completing task", { taskId: taskId.toString() });
        await TaskService_1.default.completeTask(userId, taskId);
        const task = await Task_1.default.findById(taskId).lean();
        if (task?.requiresVerification) {
            const worker = await User_1.default.findById(userId).lean();
            const managerId = worker?.manager;
            if (managerId) {
                const manager = await User_1.default.findById(managerId).lean();
                if (manager?.telegramId) {
                    if (report.messages?.length) {
                        const textMessages = report.messages
                            .filter((m) => m.type === "text")
                            .map((m) => m.content)
                            .join("\n\n");
                        const reportText = `📥 Новый отчёт по задаче *${task.title}* от ${worker.fullName}.\n\n` +
                            (textMessages || "_Отчёт без текста_");
                        // 1️⃣ Отправляем текст
                        await bot.telegram.sendMessage(manager.telegramId, reportText, {
                            parse_mode: "Markdown",
                        });
                        // 2️⃣ Отправляем фото
                        const photos = report.messages.filter((m) => m.type === "photo");
                        for (const p of photos) {
                            await bot.telegram.sendPhoto(manager.telegramId, p.content);
                        }
                        // 3️⃣ Отдельное сообщение с кнопками
                        await bot.telegram.sendMessage(manager.telegramId, "👇 Выберите действие:", telegraf_1.Markup.inlineKeyboard([
                            [
                                telegraf_1.Markup.button.callback("✅ Согласовать", `approve_task_${task._id}`),
                            ],
                            [
                                telegraf_1.Markup.button.callback("🔁 На доработку", `reject_task_${task._id}`),
                            ],
                        ]));
                    }
                }
            }
        }
        console.log("Setting user session state to task_completed_waiting", {
            userId: userId.toString(),
        });
        await UserSessionStore_1.UserSessionStore.setState(userId, "task_completed_waiting", {
            taskId: taskId.toString(),
            reportId: reportIdStr,
        });
        console.log("Editing message reply markup");
        await ctx.editMessageReplyMarkup(undefined);
        console.log("Sending finalization reply");
        await ctx.reply("📑 Отчёт сохранён, задача переведена в статус *Выполнено*. " +
            "Руководитель скоро проверит.", { parse_mode: "Markdown" });
        console.log("Finalization reply sent");
    });
};
exports.registerCompleteTaskHandler = registerCompleteTaskHandler;
exports.default = exports.registerCompleteTaskHandler;
