// models/FsmState.ts
import { Schema, model, Types, models, Document } from "mongoose";

/* --- вложенный объект live-location ------------------------------------ */
export interface ILiveLocation {
  active: boolean;            // true, если sharing считается включённым
  lastSeen?: Date;            // когда пришла последняя точка
  expireAt?: Date;            // msg.date + live_period (для watchdog)
}

/* --- payload FSM ------------------------------------------------------- */
export interface IFsmData {
  taskId?: string;           
  liveLocation?: ILiveLocation;
  [key: string]: any;
}

/* --- документ ---------------------------------------------------------- */
export interface IFsmState extends Document {
  userId?: Types.ObjectId;    // приоритет №1
  telegramId?: number;        // fallback, если нет записи в Users
  state: string;              // текущее состояние FSM
  data: IFsmData;
  updatedAt: Date;            // автоматом через timestamps
}

/* --- схема ------------------------------------------------------------- */
const LiveLocationSchema = new Schema<ILiveLocation>(
  {
    active:   { type: Boolean, default: false },
    lastSeen: { type: Date },
    expireAt: { type: Date },
  },
  { _id: false, versionKey: false }
);

const FsmStateSchema = new Schema<IFsmState>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: "User", sparse: true },
    telegramId: { type: Number, sparse: true },
    state:      { type: String, required: true },
    data: {
      taskId:       { type: String },
      liveLocation: { type: LiveLocationSchema, default: undefined },
    },
  },
  {
    /* обновляем updatedAt автоматически, createdAt не нужен */
    timestamps: { updatedAt: true, createdAt: false },
    versionKey: false,
  }
);

/* уникальность по одному из идентификаторов ---------------------------- */
FsmStateSchema.index({ userId: 1    }, { unique: true, sparse: true });
FsmStateSchema.index({ telegramId: 1 }, { unique: true, sparse: true });

export default models.FsmState ||
  model<IFsmState>("FsmState", FsmStateSchema);