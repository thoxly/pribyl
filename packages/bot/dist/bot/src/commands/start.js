"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCommand = void 0;
const User_1 = __importDefault(require("../models/User"));
const UserSessionStore_1 = require("../services/UserSessionStore");
const startCommand = async (ctx) => {
    console.log("▶️ Вызван startCommand");
    const tgUser = ctx.from;
    if (!tgUser) {
        console.warn("⛔️ Пользователь Telegram не найден в контексте");
        return;
    }
    const telegramId = tgUser.id;
    console.log(`ℹ️ Telegram ID: ${telegramId}`);
    const existingUser = await User_1.default.findOne({ telegramId });
    if (existingUser) {
        console.log(`✅ Пользователь найден: ${existingUser.fullName} (${existingUser._id})`);
        const userId = existingUser._id;
        if (!existingUser.company) {
            await UserSessionStore_1.UserSessionStore.setState(userId, "awaiting_invite_code");
            console.log("🕓 Установлено состояние FSM: awaiting_invite_code");
            await ctx.reply("Вы уже зарегистрированы, но ещё не подключены к компании.\nВведите код приглашения.");
        }
        else {
            await UserSessionStore_1.UserSessionStore.setState(userId, "authorized");
            console.log("✅ FSM-состояние: authorized");
            await ctx.reply(`👋 Добро пожаловать, ${existingUser.fullName}!`);
        }
        return;
    }
    console.log("🆕 Пользователь не найден. Ожидаем ввод кода приглашения.");
    await ctx.reply("Привет! Введите код приглашения, чтобы присоединиться к компании.");
    // В этом случае user ещё не создан, поэтому используем telegramId
    await UserSessionStore_1.UserSessionStore.setStateByTelegramId(telegramId, "awaiting_invite_code");
    console.log("🕓 FSM-состояние записано по telegramId: awaiting_invite_code");
};
exports.startCommand = startCommand;
