"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Report_1 = __importDefault(require("../models/Report"));
class ReportService {
    /** Создаём или возвращаем черновик отчёта по задаче для пользователя */
    static async getOrCreateDraft(taskId, userId) {
        // findOne может вернуть null → тип IReport | null
        const draft = await Report_1.default.findOne({
            taskId,
            userId,
            completed: false,
        })
            .lean()
            .exec(); // .exec() даёт корректный возврат Promise
        if (draft) {
            return draft; // внутри блока TypeScript сужает тип до IReport
        }
        // Если черновик не найден — создаём новый
        return Report_1.default.create({
            taskId,
            userId,
            messages: [],
        });
    }
    static async getReportIdByTaskId(taskId, userId) {
        const report = await Report_1.default.findOne({
            taskId,
            userId,
            completed: false,
        })
            .select("_id")
            .lean()
            .exec();
        return report?._id ?? null;
    }
    /** Добавить текстовое сообщение в отчёт */
    static async appendText(reportId, text, telegramMessageId) {
        await Report_1.default.updateOne({ _id: reportId, completed: false }, {
            $push: { messages: { type: "text", content: text, telegramMessageId } },
        });
    }
    /** Добавить фото (берём самый крупный file_id) */
    static async appendPhoto(reportId, fileId, telegramMessageId) {
        await Report_1.default.updateOne({ _id: reportId, completed: false }, {
            $push: {
                messages: { type: "photo", content: fileId, telegramMessageId },
            },
        });
    }
    /** Финализировать отчёт */
    static async finalize(reportId) {
        await Report_1.default.updateOne({ _id: reportId }, { completed: true });
    }
}
exports.default = ReportService;
