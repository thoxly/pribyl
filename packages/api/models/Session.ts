// src/models/Session.ts
import { Schema, model, Types, Document, models } from 'mongoose';


export interface ISession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  taskId?: Types.ObjectId | undefined;       
  startedAt: Date;
  endedAt: Date | null;
}

const sessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: Schema.Types.ObjectId, ref: "Task", required: false, },  
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },


});

sessionSchema.index({ userId: 1, startedAt: -1 });

export default models.Session || model<ISession>('Session', sessionSchema);
