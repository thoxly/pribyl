import mongoose, { Schema, Types, model } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  telegramId: number;
  fullName?: string;
  username?: string;
  photoUrl?: string;
  role: string;
  company?: mongoose.Types.ObjectId;
  onboardingCompleted: boolean;
  status: 'active' | 'pending';
  inviteCode: string;
  manager?: mongoose.Types.ObjectId; 
}

const userSchema = new Schema({
  telegramId: { type: Number, unique: true, sparse: true },
  fullName: { type: String },
  username: { type: String },
  photoUrl: { type: String },
  role: { type: String, default: 'worker' },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    default: null,
  },
  onboardingCompleted: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'pending'],
    default: 'pending',
  },
  inviteCode: { type: String, unique: true },
  manager: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Ссылка на модель User (руководитель - это другой пользователь)
    default: null, // Поле может быть пустым
  },
}, { timestamps: true });

export default mongoose.models.User || model('User', userSchema);