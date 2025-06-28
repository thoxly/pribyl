import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { BotContext } from './types/context';
import { startCommand } from './commands/start';
import { attachUser } from './middleware/attachUser';
import { attachSession } from './middleware/attachSession';
import { handleInviteCode } from './handlers/handleInviteCode';
import { inProgressTasksCommand } from './commands/inProgressTasks';
import { tasksOverviewCommand } from './commands/tasksOverview';
import { registerAcceptTaskHandler } from './handlers/registerAcceptTaskHandler';   
import { registerLiveLocationHandler }  from './handlers/registerLiveLocationHandler';   
import { registerTaskListHandlers } from './handlers/taskListHandlers';
import { registerCompleteTaskHandler } from './handlers/registerCompleteTaskHandler';
import { registerTaskVerificationHandler } from './handlers/registerTaskVerificationHandler'



dotenv.config();


const bot = new Telegraf<BotContext>(process.env.BOT_TOKEN!);

bot.use(async (ctx, next): Promise<void> => {
  console.debug('[🔍 GLOBAL UPDATE]', JSON.stringify(ctx.update, null, 2));
  await next();                 // ⚠️  пропускаем апдейт дальше
});


// ─────── middleware ───────
bot.use(attachUser);
bot.use(attachSession);

// ─────── команды ───────
bot.start(startCommand);
bot.command('tasks', tasksOverviewCommand);
bot.command('inprogress', inProgressTasksCommand);

// ─────── callback-handlers ───────
registerAcceptTaskHandler(bot);  
registerLiveLocationHandler(bot);
registerTaskListHandlers(bot);
registerCompleteTaskHandler(bot);
registerTaskVerificationHandler(bot);

// ─────── текстовые сообщения ───────


bot.on('text', async (ctx) => {
  if (!ctx.user) {
    await handleInviteCode(ctx);
  }
});

export { bot };
