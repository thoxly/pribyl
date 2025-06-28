import { Types } from "mongoose";
import ReportModel, { IReport } from "../models/Report";

export default class ReportService {
  /** Создаём или возвращаем черновик отчёта по задаче для пользователя */
  static async getOrCreateDraft(
    taskId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<IReport> {
    // findOne может вернуть null → тип IReport | null
    const draft = await ReportModel.findOne({
      taskId,
      userId,
      completed: false,
    })
      .lean<IReport>()
      .exec(); // .exec() даёт корректный возврат Promise

    if (draft) {
      return draft; // внутри блока TypeScript сужает тип до IReport
    }

    // Если черновик не найден — создаём новый
    return ReportModel.create({
      taskId,
      userId,
      messages: [],
    });
  }

  static async getReportIdByTaskId(
    taskId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<Types.ObjectId | null> {
    const report = await ReportModel.findOne({
      taskId,
      userId,
      completed: false,
    })
      .select("_id")
      .lean<{ _id: Types.ObjectId }>()
      .exec();

    return report?._id ?? null;
  }

  /** Добавить текстовое сообщение в отчёт */
  static async appendText(
    reportId: Types.ObjectId,
    text: string,
    telegramMessageId: number
  ): Promise<void> {
    await ReportModel.updateOne(
      { _id: reportId, completed: false },
      {
        $push: { messages: { type: "text", content: text, telegramMessageId } },
      }
    );
  }

  /** Добавить фото (берём самый крупный file_id) */
  static async appendPhoto(
    reportId: Types.ObjectId,
    fileId: string,
    telegramMessageId: number
  ): Promise<void> {
    await ReportModel.updateOne(
      { _id: reportId, completed: false },
      {
        $push: {
          messages: { type: "photo", content: fileId, telegramMessageId },
        },
      }
    );
  }

  /** Финализировать отчёт */
  static async finalize(reportId: Types.ObjectId): Promise<void> {
    await ReportModel.updateOne({ _id: reportId }, { completed: true });
  }
}
