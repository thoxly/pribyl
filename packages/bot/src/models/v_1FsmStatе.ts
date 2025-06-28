// models/FsmState.ts
import { Schema, model, Types, models, Document } from "mongoose";

export interface IFsmData {
  taskId?: string;
  liveLocationActive?: boolean;
  [key: string]: any;
}

export interface IFsmState extends Document {
  userId?: Types.ObjectId;
  telegramId?: number;
  state: string;
  data?: IFsmData;
  updatedAt: Date;
}

const FsmStateSchema = new Schema<IFsmState>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  telegramId: { type: Number, required: false },
  state: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now },

});

// Уникальность по одному из идентификаторов
FsmStateSchema.index({ userId: 1 }, { unique: true, sparse: true });
FsmStateSchema.index({ telegramId: 1 }, { unique: true, sparse: true });

export default models.FsmState || model<IFsmState>("FsmState", FsmStateSchema);
