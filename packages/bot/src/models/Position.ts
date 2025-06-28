/* Position.ts */
import { Schema, model, Types, Document, models } from 'mongoose';

export interface IPosition extends Document {
  userId: Types.ObjectId;
  sessionId: Types.ObjectId;
  taskId?: Types.ObjectId;       
  loc: { type: 'Point'; coordinates: [number, number] }; 
  timestamp: Date;
}

const positionSchema = new Schema<IPosition>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: Schema.Types.ObjectId, },
  taskId:    { type: Schema.Types.ObjectId, },
  loc: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  timestamp: { type: Date, default: Date.now },
});

positionSchema.index({ loc: '2dsphere' });
positionSchema.index({ userId: 1, timestamp: -1 });

export default models.Position || model<IPosition>('Position', positionSchema);
