// middleware/attachSession.ts
import type { MiddlewareFn } from 'telegraf';
import type { BotContext } from '../types/context';
import SessionModel from '../models/Session';

export const attachSession: MiddlewareFn<BotContext> = async (ctx, next) => {
  if (!ctx.user) return next(); 

  // Пытаемся найти активную сессию пользователя
  const activeSession = await SessionModel.findOne({
    userId: ctx.user._id,
    endedAt: null,
  });

  if (activeSession) {
    ctx.session = activeSession;
  } else {
    ctx.session = null;
  }

  return next();
};
