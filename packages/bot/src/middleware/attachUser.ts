// middleware/attachUser.ts
import { BotContext } from '../types/context';
import UserModel, { IUser } from '../models/User';

export const attachUser = async (ctx: BotContext, next: () => Promise<void>) => {
  if (!ctx.from) return next();

  const user = await UserModel.findOne({ telegramId: ctx.from.id });
  if (user) ctx.user = user;
  
  return next();
};