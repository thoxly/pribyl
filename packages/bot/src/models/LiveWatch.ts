// src/models/LiveWatch.ts
import { Schema, model, Types, Document } from "mongoose";

export interface ILiveWatch extends Document {
  userId: Types.ObjectId;
  messageId: number;
  lastSeen: Date;
  expireAt: Date;      // для TTL
}

const LiveWatchSchema = new Schema<ILiveWatch>({
  userId: { type: Schema.Types.ObjectId, required: true, unique: true },
  messageId: { type: Number, required: true },
  lastSeen: { type: Date, required: true },
  expireAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }, // TTL
});

export default model<ILiveWatch>("LiveWatch", LiveWatchSchema);
