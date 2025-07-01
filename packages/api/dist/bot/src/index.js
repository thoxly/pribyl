"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const telegraf_1 = require("telegraf");
const dotenv_1 = __importDefault(require("dotenv"));
const start_1 = require("./commands/start");
const attachUser_1 = require("./middleware/attachUser");
const attachSession_1 = require("./middleware/attachSession");
const handleInviteCode_1 = require("./handlers/handleInviteCode");
const inProgressTasks_1 = require("./commands/inProgressTasks");
const tasksOverview_1 = require("./commands/tasksOverview");
const registerAcceptTaskHandler_1 = require("./handlers/registerAcceptTaskHandler");
const registerLiveLocationHandler_1 = require("./handlers/registerLiveLocationHandler");
const taskListHandlers_1 = require("./handlers/taskListHandlers");
const registerCompleteTaskHandler_1 = require("./handlers/registerCompleteTaskHandler");
const registerTaskVerificationHandler_1 = require("./handlers/registerTaskVerificationHandler");
dotenv_1.default.config();
const bot = new telegraf_1.Telegraf(process.env.BOT_TOKEN);
exports.bot = bot;
bot.use(async (ctx, next) => {
    console.debug('[🔍 GLOBAL UPDATE]', JSON.stringify(ctx.update, null, 2));
    await next(); // ⚠️  пропускаем апдейт дальше
});
// ─────── middleware ───────
bot.use(attachUser_1.attachUser);
bot.use(attachSession_1.attachSession);
// ─────── команды ───────
bot.start(start_1.startCommand);
bot.command('tasks', tasksOverview_1.tasksOverviewCommand);
bot.command('inprogress', inProgressTasks_1.inProgressTasksCommand);
// ─────── callback-handlers ───────
(0, registerAcceptTaskHandler_1.registerAcceptTaskHandler)(bot);
(0, registerLiveLocationHandler_1.registerLiveLocationHandler)(bot);
(0, taskListHandlers_1.registerTaskListHandlers)(bot);
(0, registerCompleteTaskHandler_1.registerCompleteTaskHandler)(bot);
(0, registerTaskVerificationHandler_1.registerTaskVerificationHandler)(bot);
// ─────── текстовые сообщения ───────
bot.on('text', async (ctx) => {
    if (!ctx.user) {
        await (0, handleInviteCode_1.handleInviteCode)(ctx);
    }
});
