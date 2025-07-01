"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTaskToWorker = void 0;
const __1 = require("../");
const User_1 = __importDefault(require("../models/User"));
const Task_1 = __importDefault(require("../models/Task"));
const escapeMarkdown_1 = require("../utils/escapeMarkdown");
const UserSessionStore_1 = require("../services/UserSessionStore");
const sendTaskToWorker = async (taskInput) => {
    try {
        if (!taskInput.workerId || !taskInput.company) {
            console.warn(`Задача ${taskInput._id} не содержит workerId или company`);
            return;
        }
        const task = await Task_1.default.findById(taskInput._id)
            .populate("createdBy", "fullName")
            .lean();
        if (!task) {
            console.warn(`Задача ${taskInput._id} не найдена`);
            return;
        }
        if (!task.company) {
            console.warn(`Задача ${task._id} не содержит company`);
            return;
        }
        const worker = await User_1.default.findById(task.workerId).lean();
        if (!worker?.telegramId) {
            console.warn(`Пользователь ${task.workerId} не найден или не привязан Telegram`);
            return;
        }
        if (!worker.company || worker.company.toString() !== task.company.toString()) {
            console.warn(`Пользователь ${worker._id} не принадлежит компании задачи`);
            return;
        }
        await UserSessionStore_1.UserSessionStore.setState(worker._id, "awaiting_task_in_progress", {
            taskId: task._id.toString(),
        });
        const parts = ["🛠 *Вам назначена новая задача*"];
        if (task.title)
            parts.push(`*Название:* ${(0, escapeMarkdown_1.escapeMarkdownV2)(task.title)}`);
        if (task.address)
            parts.push(`*Адрес:* ${(0, escapeMarkdown_1.escapeMarkdownV2)(task.address)}`);
        if (task.dateStart)
            parts.push(`*Начало:* ${(0, escapeMarkdown_1.escapeMarkdownV2)(new Date(task.dateStart).toLocaleString())}`);
        if (task.deadline)
            parts.push(`*Дедлайн:* ${(0, escapeMarkdown_1.escapeMarkdownV2)(new Date(task.deadline).toLocaleString())}`);
        if (task.description)
            parts.push(`*Описание:* ${(0, escapeMarkdown_1.escapeMarkdownV2)(task.description)}`);
        if (task.createdBy?.fullName)
            parts.push(`*Создано:* ${(0, escapeMarkdown_1.escapeMarkdownV2)(task.createdBy.fullName)}`);
        const message = parts.join("\n");
        await __1.bot.telegram.sendMessage(worker.telegramId, message, {
            parse_mode: "MarkdownV2",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✅ Взять в работу", callback_data: `accept_${task._id}` }],
                    [{ text: "🔙 Вернуться к списку задач", callback_data: "back_to_assigned_task" }],
                ],
            },
        });
    }
    catch (err) {
        console.error("Ошибка при отправке задачи воркеру:", err);
    }
};
exports.sendTaskToWorker = sendTaskToWorker;
