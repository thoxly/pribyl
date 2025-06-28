import { bot } from "../";

export const sendTelegramMessage = async (telegramId: number | string, text: string): Promise<void> => {
  try {
    await bot.telegram.sendMessage(telegramId, text);
  } catch (error) {
    console.error(`Ошибка при отправке сообщения Telegram ID ${telegramId}:`, error);
  }
};
