"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTaskVerificationHandler = void 0;
const mongoose_1 = require("mongoose");
const Task_1 = __importDefault(require("../models/Task"));
const User_1 = __importDefault(require("../models/User"));
const TaskService_1 = __importDefault(require("../services/TaskService"));
const registerTaskVerificationHandler = (bot) => {
    console.log("Registering task verification handler");
    // ✅ Согласовать задачу
    bot.action(/^approve_task_(.+)$/, async (ctx) => {
        console.log("Action: approve task triggered", {
            action: ctx.match[0],
            taskId: ctx.match[1],
        });
        const taskIdStr = ctx.match[1];
        if (!mongoose_1.Types.ObjectId.isValid(taskIdStr)) {
            console.error("Invalid taskId", { taskIdStr });
            return;
        }
        const taskId = new mongoose_1.Types.ObjectId(taskIdStr);
        const task = await Task_1.default.findById(taskId).lean();
        if (!task) {
            console.error("Task not found", { taskId: taskIdStr });
            return;
        }
        const worker = task.workerId
            ? await User_1.default.findById(task.workerId).lean()
            : null;
        const managerTelegramId = ctx.from?.id?.toString();
        await TaskService_1.default.doneTask(taskId);
        console.log("Task status updated to done");
        // Уведомление исполнителю
        if (worker?.telegramId) {
            await bot.telegram.sendMessage(worker.telegramId, `✅ Ваша задача *${task.title}* принята руководителем.`, { parse_mode: "Markdown" });
            console.log("Worker notified");
        }
        // Уведомление менеджеру
        if (managerTelegramId) {
            await ctx.reply(`✅ Задача *${task.title}* принята.`, {
                parse_mode: "Markdown",
            });
        }
    });
    // 🔁 Отправить задачу на доработку
    bot.action(/^reject_task_(.+)$/, async (ctx) => {
        console.log("Action: reject task triggered", {
            action: ctx.match[0],
            taskId: ctx.match[1],
        });
        const taskIdStr = ctx.match[1];
        if (!mongoose_1.Types.ObjectId.isValid(taskIdStr)) {
            console.error("Invalid taskId", { taskIdStr });
            return;
        }
        const taskId = new mongoose_1.Types.ObjectId(taskIdStr);
        const task = await Task_1.default.findById(taskId).lean();
        if (!task) {
            console.error("Task not found", { taskId: taskIdStr });
            return;
        }
        const worker = task.workerId
            ? await User_1.default.findById(task.workerId).lean()
            : null;
        const managerTelegramId = ctx.from?.id?.toString();
        await TaskService_1.default.rejectTask(taskId);
        console.log("Task status updated to needs_rework");
        // Уведомление исполнителю
        if (worker?.telegramId) {
            await bot.telegram.sendMessage(worker.telegramId, `🔁 Ваша задача *${task.title}* отправлена на доработку руководителем.`, { parse_mode: "Markdown" });
            console.log("Worker notified");
        }
        // Уведомление менеджеру
        if (managerTelegramId) {
            await ctx.reply(`🔁 Задача *${task.title}* отправлена на доработку.`, {
                parse_mode: "Markdown",
            });
            console.log("Manager message edited");
        }
    });
};
exports.registerTaskVerificationHandler = registerTaskVerificationHandler;
exports.default = exports.registerTaskVerificationHandler;
