import mongoose, { Schema, model, Types, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  address?: string;
  workerId?: Types.ObjectId;
  status:
    | "assigned"
    | "accepted"
    | "in-progress"
    | "completed"
    | "overdue"
    | "needs_rework"
    | "done"
    | "cancelled";
  dateStart?: Date;
  deadline?: Date;
  description?: string;
  createdBy?: Types.ObjectId;
  report?: Types.ObjectId;
  company?: Types.ObjectId;
  sessionIds?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
  requiresVerification: boolean; 
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    address: { type: String },
    workerId: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: [
        "assigned",
        "accepted",
        "in-progress",
        "completed",
        "overdue",
        "needs_rework",
        "done",
        "cancelled",
      ],
      default: "assigned",
    },
    dateStart: { type: Date },
    deadline: { type: Date },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    report: { type: Schema.Types.ObjectId, ref: "Report" },
    company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    sessionIds: [{ type: Schema.Types.ObjectId, ref: "Session" }],
    requiresVerification: { type: Boolean, default: false }, 
  },
  { timestamps: true }
);

export default mongoose.models.Task || model<ITask>("Task", taskSchema);