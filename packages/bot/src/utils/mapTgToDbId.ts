
import UserModel from '../models/User';
import { Types } from 'mongoose';


export async function mapTgToDbId(telegramId: number | string): Promise<Types.ObjectId | null> {
  const user = await UserModel
    .findOne({ telegramId: telegramId.toString() })  
    .select('_id')                                  
    .lean<{ _id: Types.ObjectId }>();

  return user?._id ?? null;
}
