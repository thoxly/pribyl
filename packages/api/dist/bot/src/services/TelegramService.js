"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTelegramMessage = void 0;
const __1 = require("../");
const sendTelegramMessage = async (telegramId, text) => {
    try {
        await __1.bot.telegram.sendMessage(telegramId, text);
    }
    catch (error) {
        console.error(`Ошибка при отправке сообщения Telegram ID ${telegramId}:`, error);
    }
};
exports.sendTelegramMessage = sendTelegramMessage;
