import mongoose, { Schema, model, models, Types, Document } from "mongoose";

export interface IReportMessage {
  type: "text" | "photo";
  content: string; // text либо file_id / URL фото
  telegramMessageId: number;
}

export interface IReport extends Document {
  _id: Types.ObjectId;
  taskId: Types.ObjectId;
  userId: Types.ObjectId;
  messages: IReportMessage[];
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    messages: [
      {
        type: {
          type: String,
          enum: ["text", "photo"],
          required: true,
        },
        content: { type: String, required: true },
        telegramMessageId: { type: Number, required: true },
      },
    ],
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Report || model<IReport>("Report", ReportSchema);
